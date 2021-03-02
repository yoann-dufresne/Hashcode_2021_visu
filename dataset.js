var problem = null;
var solution = null;


class Intersection {
  constructor(idx) {
    this.idx = idx;
    this.input_streets = [];
    this.output_streets = [];
  }
}


class Street {
  constructor(from, to, name, time) {
    this.from = Number(from);
    this.to = Number(to);
    this.name = name;
    this.time = Number(time);
  }
}

class Car {
  constructor(streets) {
    this.streets = streets;
  }
}


class Problem {
  constructor(d, i, s, v, f) {
    this.D = Number(d);
    this.I = Number(i);
    this.S = Number(s);
    this.V = Number(v);
    this.F = Number(f);

    this.intersections = {};
    for (let i=0 ; i<this.I ; i++)
      this.intersections[i] = new Intersection(i);
    this.streets = {};
    this.cars = [];
  }
}


class Solution {
  constructor(problem) {
    this.pb = problem;
    this.cycles = {};
    this.lights = {};
  }

  compute_lights() {

  }
}


function parse_problem(file_content) {
  let lines = file_content.split("\n");
  let header = lines[0].split(" ");
  problem = new Problem(...header);

  let street_lines = lines.slice(1, problem.S+1);
  for (let line of street_lines) {
    let street = new Street(...line.split(" "));
    problem.streets[street.name] = street;
    problem.intersections[street.from].output_streets.push(street);
    problem.intersections[street.to].input_streets.push(street);
  }

  let car_lines = lines.slice(problem.S+1, problem.S+1+problem.V);
  for (let line of car_lines) {
    problem.cars.push(new Car(line.split(" ").slice(1)));
  }

  console.log(problem);
  console.log("--- problem loaded ---");

  return problem;
}


function problem_select(callback=()=>{}) {
  let filename = this.value;
  if (filename == "")
    return;

  console.log("loading problem " + filename);
  fetch("/data/" + filename)
  .then(response => response.text())
  .then(txt => parse_problem(txt))
  .then(pb => problem = pb)
  .then(()=>{callback();});
}
document.getElementById("problem").onchange = problem_select;


let problem_names = ["a.txt", "b.txt", "c.txt", "d.txt", "e.txt", "f.txt"];
function parse_solution(file_content) {
  // if 
  let sol = new Solution(problem);

  let lines = file_content.split("\n");
  let intersection_used = Number(lines[0]);
  for (let idx=1 ; idx<lines.length ; idx++) {
    let inter_idx = Number(lines[idx++]);
    let nb_traffic_lights = Number(lines[idx++]);
    let cycle = [];
    for (let tl_idx=0 ; tl_idx<nb_traffic_lights ; tl_idx++, idx++) {
      pair = lines[idx].split(" ");
      pair[1] = Number(pair[1]);
      cycle.push(pair);
    }
    sol.cycles[inter_idx] = cycle;
  }

  solution = sol;
  console.log(sol);
  console.log("--- Solution loaded ---")
  return sol;
}

function solution_upload(event) {
  let file = event.target.files[0];

  if (problem == null) {
    for (let pb_name of problem_names) {
      if (file.name.startsWith(pb_name)) {
        let pb_select = document.getElementById("problem");
        pb_select.value = pb_name;
        pb_select.onchange(()=>{solution_upload(event)});
        return;
      }
    }
    alert("A problem must be loaded first");
    return;
  }
  console.log("loading " + file.name);

  var reader = new FileReader();
  reader.onload = (evt) => {parse_solution(evt.target.result);};
  reader.readAsText(file);
}
document.getElementById("solution").onchange = solution_upload;


