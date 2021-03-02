var problem = null;

class Intersection {
  constructor(idx) {
    this.idx = idx;
    this.input_streets = {};
    this.output_streets = {};
  }
}


class Problem {
  constructor(d, i, s, v, f) {
    this.D = d;
    this.I = i;
    this.S = s;
    this.V = v;
    this.F = f;
  }
}


function parse_problem(file_content) {
  let lines = file_content.split("\n");
  let header = lines[0].split(" ").map(Number);
  problem = new Problem(...header);

  return problem;
}


function problem_select() {
  let filename = this.value;
  if (filename == "")
    return;

  console.log("loading problem " + filename);
  fetch("/data/" + filename)
  .then(response => response.text())
  .then(txt => parse_problem(txt))
  .then(pb => problem = pb);
}
document.getElementById("problem").onchange = problem_select;
