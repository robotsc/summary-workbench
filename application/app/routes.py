from flask import render_template, redirect, jsonify, url_for, flash
from app import app
from app.forms import FilesSubmitForm, FileUploadForm, OutputSaveForm
from app.filehandler import FileHandler
from rouge import Rouge
from collections import defaultdict
from ast import literal_eval



left_docs = FileHandler()
right_docs = FileHandler()
saved_metrics = []


def gen_table(table_dict):
    table = {}
    thead = [""]
    tbody = defaultdict(list)
    for metric, metric_info in table_dict.items():
        thead.append(metric)
        for key, value in metric_info.items():
            tbody[key].append("{:.2f}".format(value))
    table["thead"] = thead
    table["tbody"] = tbody
    return table


@app.route("/", methods=["GET", "POST"])
def index():
    form_choice = FilesSubmitForm()
    form_upload_left = FileUploadForm(prefix="form_left")
    form_upload_right = FileUploadForm(prefix="form_right")
    form_save = OutputSaveForm()

    form_choice.file_left.choices = left_docs.choices()
    form_choice.file_right.choices = right_docs.choices()

    try:
        if form_choice.validate_on_submit():
            file_left_name = form_choice.file_left.data
            file_right_name = form_choice.file_right.data
            file_left = left_docs[file_left_name]
            file_right = right_docs[file_right_name]
            rouge = Rouge()
            table_dict = rouge.get_scores(file_left, file_right, avg=True)
            table = gen_table(table_dict)
            form_save.name.data = file_left_name + "-" + file_right_name
            form_save.metric_info.data = table_dict
            return render_template("index.html", form_choice=form_choice, form_upload_left=form_upload_left, form_upload_right=form_upload_right, form_save=form_save, table=table, saved_metrics=saved_metrics)
        if form_upload_left.validate_on_submit():
            filename = form_upload_left.file.data.filename
            filecontent = form_upload_left.file.data.read().decode("utf-8")
            left_docs[filename] = filecontent.splitlines()
        if form_upload_right.validate_on_submit():
            filename = form_upload_right.file.data.filename
            filecontent = form_upload_right.file.data.read().decode("utf-8")
            right_docs[filename] = filecontent.splitlines()
        if form_save.validate_on_submit():
            name = form_save.name.data
            table = gen_table(literal_eval(form_save.metric_info.data))
            saved_metrics.insert(0, (name, table))
    except Exception as e:
        flash(str(e))

    form_choice.file_left.choices = left_docs.choices()
    form_choice.file_right.choices = right_docs.choices()

    return render_template("index.html", form_choice=form_choice, form_upload_left=form_upload_left, form_upload_right=form_upload_right, saved_metrics=saved_metrics)


@app.route("/delete", methods=["GET", "POST"])
def upload_left():
    left_docs.clear()
    right_docs.clear()
    return redirect(url_for("index"))
