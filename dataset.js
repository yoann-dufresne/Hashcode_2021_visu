var problem = null;

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
  console.log("--- problem loaded ---")

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
