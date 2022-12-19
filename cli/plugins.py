import json
import re
import uuid
from collections import defaultdict
from itertools import chain

from .config import (CONTAINER_PLUGIN_FILES_PATH, CONTAINER_PLUGIN_SERVER_PATH,
                     DEFAULT_PLUGIN_CONFIG, DEPLOY_PATH, DEV_BOOT_PATH,
                     KUBERNETES_TEMPLATES_PATH, PLUGIN_DOCKERFILE_PATH,
                     PLUGIN_SERVER_PATH, REQUIRED_FILE_GROUPS,
                     SETUP_PLUGIN_FILES_DOCKER_FILE,
                     SETUP_SERVER_FILES_DOCKER_FILE)
from .docker_interface import DockerMixin
from .exceptions import BaseManageError, InvalidPluginTypeError
from .git_interface import pull, resolve_source
from .schema import ConfigurePluginModel, PluginModel
from .utils import Yaml, get_config, python_version_from_path

name_pattern = "-_a-zA-Z0-9() "


def resolve_path(path):
    path = path.absolute()
    if not path.exists():
        raise BaseManageError("path does not exist", path)
    return path


def expand_name(name, args, origin):
    try:
        name = name.format(**args)
    except KeyError as e:
        (key,) = e.args
        raise BaseManageError(
            f"Key '{key}' was not provided for the plugin name '{name}'. Specify '{key}' under 'environment' in the plugin options.",
            origin,
        )
    if not re.match(f"^[{name_pattern}]+$", name):
        raise BaseManageError(
            f"invalid name '{name}' only '{name_pattern}' allowed", origin
        )
    return name


PLUGIN_TYPES = {"metric", "summarizer"}


def clean_string(s):
    clean_s = s
    clean_s = clean_s.lower()
    clean_s = re.sub(r"\s", "", clean_s)
    clean_s = re.sub("[^a-z0-9]", "", clean_s)
    if not clean_s:
        raise BaseManageError(
            f"{s} is empty after cleaning, please choose a name containing 'a-z0-9'"
        )
    return clean_s


def quote(string):
    return string.replace('"', r"\"").replace("$", r"\$")


def check_if_required_files_present(path):
    for filegroup in REQUIRED_FILE_GROUPS:
        for filename in filegroup:
            if (path / filename).exists():
                break
        else:
            raise BaseManageError(
                f"none of [{', '.join(filegroup)}] exists, provide at least one",
                path,
            )


class Plugin(DockerMixin):
    def __init__(
        self,
        *,
        plugin_type,
        source,
        disabled,
        image_url,
        environment,
        extern_environment,
        docker_username,
        resources,
    ):
        if plugin_type not in PLUGIN_TYPES:
            raise InvalidPluginTypeError(f"invalid type {plugin_type}")
        self.plugin_type = plugin_type
        self.plugin_path, self.owner = resolve_source(source)
        self.clean_owner = clean_string(self.owner) if self.owner else ""
        self.disabled = disabled
        self.extern_environment = extern_environment
        self.resources = resources

        check_if_required_files_present(self.plugin_path)

        config_path = self.plugin_path / DEFAULT_PLUGIN_CONFIG
        config = PluginModel.load(config_path, **Yaml.load(config_path, json=True))
        self.version = config.version
        self.metadata = config.metadata
        self.metadata.update(environment)
        self.environment = self.metadata.copy()

        self.name = expand_name(config.name, self.environment, source)
        self.clean_name = clean_string(self.name)

        self.dockerfile_path = self.plugin_path / "Dockerfile"
        if not self.dockerfile_path.exists():
            self.dockerfile_path = PLUGIN_DOCKERFILE_PATH

        self.unique_name = (
            f"{self.plugin_type.lower()}-{self.clean_owner or 'null'}-{self.clean_name}"
        ).strip("-")
        self.url = f"http://{self.unique_name}:5000"

        self.plugin_config = {
            "buildtag": str(uuid.uuid4()),
            "metadata": self.metadata,
            "name": self.name,
            "owner": self.owner,
            "key": self.unique_name,
            "type": self.plugin_type,
            "version": self.version,
        }
        self.environment["PLUGIN_CONFIG"] = json.dumps(self.plugin_config)
        self.all_environment = {**self.environment, **self.extern_environment}

        self.dev_environment = [
            f"{key}={value}" for key, value in self.all_environment.items()
        ]
        self.kubernetes_environment = [
            {"name": key, "value": value}
            for key, value in self.extern_environment.items()
        ]

        self.build_environment = "\n".join(
            f"ENV {env}"
            for env in [
                f'{key}="{quote(value)}"' for key, value in self.environment.items()
            ]
        )
        self.named_volumes = {
            f"{self.unique_name}_root": "/root",
        }
        self.docker_compose_named_volumes = {key: None for key in self.named_volumes}
        self.path_volumes = {
            str(PLUGIN_SERVER_PATH): str(CONTAINER_PLUGIN_SERVER_PATH),
            str(self.plugin_path): str(CONTAINER_PLUGIN_FILES_PATH),
        }
        self.volumes = {**self.named_volumes, **self.path_volumes}
        self.path_volumes = {
            str(PLUGIN_SERVER_PATH): str(CONTAINER_PLUGIN_SERVER_PATH),
            str(self.plugin_path): str(CONTAINER_PLUGIN_FILES_PATH),
        }
        DockerMixin.__init__(
            self,
            deploy_src=KUBERNETES_TEMPLATES_PATH / "plugin.yaml",
            deploy_dest=DEPLOY_PATH
            / f"{self.plugin_type.lower()}"
            / f"{self.name}.yaml",
            docker_username=docker_username,
            name=self.unique_name,
            image_url=image_url,
        )

    def pull(self):
        if self.owner is not None:
            pull(self.plugin_path)

    def get_version(self):
        return self.version

    def python_version_arg(self):
        return python_version_from_path(self.plugin_path)

    def build_chain_args(self):
        dockerfile = resolve_path(self.dockerfile_path).read_text()
        return [
            {
                "dockerfile": dockerfile,
                "context_path": self.plugin_path,
                "buildargs": self.python_version_arg(),
            },
            {
                "dockerfile": SETUP_SERVER_FILES_DOCKER_FILE,
                "context_path": PLUGIN_SERVER_PATH,
            },
            {
                "dockerfile": SETUP_PLUGIN_FILES_DOCKER_FILE.format(
                    environment=self.build_environment
                ),
                "context_path": self.plugin_path,
            },
        ]

    def patch(self):
        labels = {"tier": self.unique_name, "version": self.version}
        container = {
            "name": self.unique_name,
            "image": self.image_url,
            "env": self.kubernetes_environment,
        }
        if self.resources:
            container["resources"] = self.resources
        deployment = {
            "metadata": {"name": self.unique_name, "labels": labels},
            "spec": {
                "selector": {"matchLabels": labels},
                "template": {
                    "metadata": {"labels": labels},
                    "spec": {"containers": {0: container}},
                },
            },
        }
        service = {
            "metadata": {"name": self.unique_name},
            "spec": {"selector": labels},
        }
        return {0: deployment, 1: service}

    def to_service(self):
        dockerfile_path = resolve_path(self.dockerfile_path)
        python_version = self.python_version_arg()
        build_args = {"args": python_version} if python_version is not None else {}
        return {
            self.unique_name: {
                "image": f"{self.unique_name}:latest",
                "build": {
                    "context": str(dockerfile_path.parent),
                    "dockerfile": dockerfile_path.name,
                    **build_args,
                },
                "working_dir": str(CONTAINER_PLUGIN_FILES_PATH),
                "volumes": [":".join(item) for item in self.volumes.items()],
                "command": f"bash {DEV_BOOT_PATH}",
                "environment": self.dev_environment,
            }
        }


class Plugins:
    def __init__(self, plugin_dict):
        self.plugin_dict = plugin_dict

    def to_list(self):
        return chain.from_iterable(self.plugin_dict.values())

    def to_dict(self):
        return self.plugin_dict.copy()

    def __iter__(self):
        return iter(self.to_list())

    def plugin_config(self):
        enabled_plugins = {
            plugin.unique_name: plugin.url for plugin in self if not plugin.disabled
        }
        disabled_plugins = {
            plugin.unique_name: plugin.plugin_config
            for plugin in self
            if plugin.disabled
        }
        return {**enabled_plugins, **disabled_plugins}

    def enabled(self):
        return [plugin for plugin in self if not plugin.disabled]

    def gen_kubernetes(self):
        for plugin in self.enabled():
            plugin.gen_kubernetes()

    @classmethod
    def load(cls):
        config = get_config()
        deploy = config.deploy
        resources = deploy.resources if deploy else None
        plugins = defaultdict(list)
        for plugin_type in PLUGIN_TYPES:
            config_key = f"{plugin_type}s"
            init_args_list = getattr(config, config_key)
            for init_args in init_args_list:
                if not isinstance(init_args, ConfigurePluginModel):
                    init_args = ConfigurePluginModel(source=init_args)
                init_args = init_args.dict()
                init_args["extern_environment"] = {
                    **init_args["extern_environment"],
                    **config.extern_environment,
                }
                plugins[config_key].append(
                    Plugin(
                        plugin_type=plugin_type,
                        **init_args,
                        docker_username=config.docker_username,
                        resources=resources,
                    )
                )
        return cls(dict(plugins))
