var problem = null;
var solution = null;
var viewer = null;


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
  constructor(idx, streets) {
    this.idx = idx;
    this.streets = streets;
  }

  next_street(street_name) {
    for (let i=0 ; i<this.streets.length-1 ; i++) {
      if (this.streets[i] == street_name) {
        return this.streets[i+1];
      }
    }
    return null;
  }
}


class Problem {
  constructor(d, i, s, v, f) {
    this.D = Number(d);
    this.I = Number(i);
    this.S = Number(s);
    this.V = Number(v);
    this.F = Number(f);

    this.intersections = new Map();
    for (let i=0 ; i<this.I ; i++)
      this.intersections[i] = new Intersection(i);
    this.streets = new Map();
    this.cars = [];
  }
}


class Light {
  constructor(start, duration, cycle) {
    this.start = start;
    this.duration = duration;
    this.cycle = cycle;
    this.net = 0; // Not early than
  }

  is_green(time) {
    let reduced = time % this.cycle;
    console.log(reduced);

    if (reduced >= this.start && reduced < this.start + this.duration)
      return true;
    else
      return false;
  }

  next_green(time) {
    // Not before net !
    if (time < this.net)
      time = this.net;

    let reduced = time % this.cycle;
    if (reduced < this.start)
      return time + this.start - reduced;
    else if (reduced >= this.start + this.duration)
      return time + this.cycle - reduced + this.start;
    else
      return time;
  }

  update_net(time) {
    this.net = time;
  }
}

class CarPosition {
  constructor(car) {
    this.car = car;
    this.time = 0;
    this.path_idx = 0;
  }

  inf(car_pos) {
    return this.time < car_pos.time;
  }
}

function search_position(car_pos, array) {
  for (let i=0 ; i<array.length ; i++)
    if (car_pos.inf(array[i]))
      return i;
  return array.length;
}

class SolutionFast {
  constructor(problem) {
    this.pb = problem;
    this.lights = new Map();
    this.score = 0;
    this.car_journeys = [];
    for (let i=0 ; i<this.pb.V ; i++)
      this.car_journeys.push([]);
  }

  add_cycle(cycle) {
    for (let i=0 ; i<cycle.length ; i++) {
      let cycle_duration = cycle.map(x=>x[1]).reduce((x,y)=>x+y);
      let start_time = 0;
      for (let pair of cycle) {
        let street = pair[0];
        let duration = pair[1];

        this.lights[street] = new Light(start_time, duration, cycle_duration);
        start_time += duration;
      }
    }
  }

  car_step(car_pos) {
    let current_light = this.lights[car_pos.car.streets[car_pos.path_idx]];
    if (current_light == undefined) {
      this.car_journeys[car_pos.car.idx].push(Math.max(0, this.pb.D - car_pos.time));
      this.car_journeys[car_pos.car.idx].push(0);
      this.car_journeys[car_pos.car.idx].push(0);
      return null;
    }
    
    // 1 - Next Green ?
    let green_time = current_light.next_green(car_pos.time);
    this.car_journeys[car_pos.car.idx].push(green_time - car_pos.time);

    // 2 - Update Light
    current_light.update_net(green_time+1);

    // 3 - move to next street
    let next_street = this.pb.streets[car_pos.car.streets[car_pos.path_idx+1]];
    car_pos.path_idx += 1;
    car_pos.time = green_time + next_street.time;
    this.car_journeys[car_pos.car.idx].push(next_street.time);

    // 4 - Car over ?
    if (car_pos.path_idx == car_pos.car.streets.length-1) {
      // Final street => compute score
      if (car_pos.time <= this.pb.D) {
        this.car_journeys[car_pos.car.idx].push(this.pb.F + this.pb.D - car_pos.time);
        this.score += this.pb.F + this.pb.D - car_pos.time;
      } else
        this.car_journeys[car_pos.car.idx].push(0);
      return null;
    } else {
      return car_pos;
    }
  }

  compute() {
    // Init
    let car_positions = [];
    for (let car of this.pb.cars) {
      car_positions.push(new CarPosition(car));
    }

    // Compute until all cars over
    while (car_positions.length > 0) {
      let current = car_positions.shift();
      let next = this.car_step(current);

      if (next != null) {
        let idx = search_position(next, car_positions);
        car_positions.splice(idx, 0, next);
      }
    }

    return this.score;
  }
}


function parse_solution(file_content) {
  let sol = new SolutionFast(problem);

  let lines = file_content.split("\n");
  let intersection_used = Number(lines[0]);
  for (let idx=1 ; idx<lines.length ; idx++) {
    if (lines[idx] == "")
      continue;
    let inter_idx = Number(lines[idx++]);
    let nb_traffic_lights = Number(lines[idx++]);
    let cycle = [];
    for (let tl_idx=0 ; tl_idx<nb_traffic_lights ; tl_idx++, idx++) {
      let pair = lines[idx].split(" ");
      pair[1] = Number(pair[1]);
      cycle.push(pair);
    }
    idx--;
    sol.add_cycle(cycle);
  }

  solution = sol;
  // console.log(sol);
  console.log("--- Solution loaded ---");
  let score = sol.compute();
  console.log("score ", score);

  return sol;
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
  let car_idx=0;
  for (let line of car_lines) {
    problem.cars.push(new Car(car_idx++, line.split(" ").slice(1)));
  }

  // console.log(problem);
  console.log("--- problem loaded ---");

  return problem;
}


function problem_select(callback=()=>{}) {
  let filename = this.value;
  if (filename == "")
    return;

  console.log("loading problem " + filename);
  fetch("data/" + filename)
  .then(response => response.text())
  .then(txt => parse_problem(txt))
  .then(pb => problem = pb)
  .then(()=>{if (typeof callback == "function") callback();});
}
document.getElementById("problem").onchange = problem_select;


let problem_names = ["a.txt", "b.txt", "c.txt", "d.txt", "e.txt", "f.txt"];
let current_pb = null;
function solution_upload(event) {
  let file = event.target.files[0];

  let pb_name = file.name.slice(0, 5);
  if (current_pb == null && !problem_names.includes(pb_name)) {
    alert("A problem must be loaded first");
    return;
  } else if (pb_name != current_pb && problem_names.includes(pb_name)) {
    let pb_select = document.getElementById("problem");
    pb_select.value = pb_name
    current_pb = pb_name;
    pb_select.onchange(()=>{solution_upload(event)});
    return;
  }

  console.log("loading " + file.name);

  var reader = new FileReader();
  reader.onload = (evt) => {
    let sol = parse_solution(evt.target.result);
    viewer = new SolutionViewer(sol);
  };
  reader.readAsText(file);
}
document.getElementById("solution").onchange = solution_upload;


// ---- Debug to remove ----

let sol_txt = "3\n2\n1\nrue-de-moscou 1\n0\n1\nrue-de-londres 1\n1\n2\nrue-d-athenes 1\nrue-d-amsterdam 1\n";
document.getElementById("problem").value = "a.txt";
document.getElementById("problem").onchange(()=>{
    let sol = parse_solution(sol_txt);
    viewer = new SolutionViewer(sol);
  });
