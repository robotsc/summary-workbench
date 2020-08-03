const transformScores = (scores, precision) => {
  scores.sort();
  const names = scores.map((row) => row[0]);
  const values = scores.map((row) => row[1].toFixed(precision));
  return [names, values];
};

const toLatex = (scores, transpose, precision) => {
  const [names, values] = transformScores(scores, precision);
  if (transpose) {
    return `\\begin{tabular}{l${"r".repeat(scores.length)}}
\\toprule
{} & ${names.join(" & ")} \\\\
\\midrule
\\textbf{score} & ${values.join(" & ")} \\\\
\\bottomrule
\\end{tabular}`;
  } else {
    return `\\begin{tabular}{lr}
\\toprule
{} & score \\\\
\\midrule
${names.map((name, i) => `\\textbf{${name}} & ${values[i]} \\\\`).join("\n")}
\\bottomrule
\\end{tabular}`;
  }
};

const toCSV = (scores, transpose, precision) => {
  const [names, values] = transformScores(scores, precision);
  if (transpose) {
    return `${names.join(",")}\n${values.join(",")}`;
  } else {
    return `metric,score\n${names.map((name, i) => `${name},${values[i]}`).join("\n")}`;
  }
};

export { toLatex, toCSV };
