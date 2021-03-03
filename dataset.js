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
    let max_time = Math.ceil(this.pb.D * 1.1);
    for (let inter_idx=0 ; inter_idx<this.pb.I ; inter_idx++) {
      // Intersection absent from the output : All red
      if (this.cycles[inter_idx] == undefined) {
        for (let street of this.pb.intersections[inter_idx].input_streets) {
          this.lights[street.name] = [...Array(max_time)].map(x=>false);
        }
      }
      // Intersection present
      else {
        let cycle = this.cycles[inter_idx];
        let cycle_time = cycle.map(x=>x[1]).reduce((x,y)=>x+y);
        let cycle_green = cycle.map(x=>[...Array(x[1])].map(y=>x[0])).reduce((x,y)=>x.concat(y));

        for (let street of this.pb.intersections[inter_idx].input_streets) {
          this.lights[street.name] = [];
        }
        
        for (let t_idx=0 ; t_idx<max_time ; t_idx++) {
          let green_street = cycle_green[t_idx % cycle_time];
          for (let street of this.pb.intersections[inter_idx].input_streets) {
            this.lights[street.name].push(street.name == green_street);   
          }
        }
      }
    }
  }

  compute_cars() {
    // --- Precomputation ---
    let max_time = Math.ceil(this.pb.D * 1.1);
    this.car_positions = [[...Array(this.pb.V).map(x=>null)]];

    // Create one car stack for each end of street
    let stacked_cars = {};
    for (let st of Object.values(this.pb.streets)) {
      stacked_cars[st.name] = [];
    }

    // Fill the stacks for the beginning of the simulation
    for (let car of this.pb.cars) {
      let street = this.pb.streets[car.streets[0]];
      this.car_positions[0][car.idx] = [street.name, street.time-1];
      stacked_cars[street.name].push(car.idx);
    }
    
    // --- Run the simulation ---
    for (let t=1 ; t<max_time ; t++) {
      // Add a new line for car positions
      this.car_positions.push([...Array(this.pb.V).map(x=>null)]);
      let to_push = [];

      // Move cars on roads
      let previous_positions = this.car_positions[this.car_positions.length - 2];
      for (let car of this.pb.cars) {
        let street_name = previous_positions[car.idx][0];
        if (street_name == null) {
          this.car_positions[this.car_positions.length-1][car.idx] = previous_positions[car.idx];
          continue;
        }

        let street = this.pb.streets[street_name];
        let street_position = previous_positions[car.idx][1];
        if (street_position + 1 < street.time) {
          // One unit move
          this.car_positions[this.car_positions.length-1][car.idx] = [street_name, street_position+1];
          // At the end of the road
          if (street_position+1 == street.time-1) {
            to_push.push([street.name, car.idx]);
            // stacked_cars[street.name].push(car.idx);
          }
        } else {
          // No move
          this.car_positions[this.car_positions.length-1][car.idx] = [street_name, street_position];
        }
      }

      // Move cars at the first position of each intersection with green light
      for (let street_name of Object.keys(this.lights)) {
        // Green light and at least one car
        if (this.lights[street_name] && stacked_cars[street_name].length > 0) {
          // Remove the first waiting car from the street.
          let car = this.pb.cars[stacked_cars[street_name].shift()];
          let next_street = car.next_street(street_name);


          // End of the travel
          if (next_street == null)
            this.car_positions[this.car_positions.length-1][car.idx] = [null];
          // Change the street
          else {
            this.car_positions[this.car_positions.length-1][car.idx] = [next_street, 0];

            // Is it directly the traffic light ?
            if (this.pb.streets[next_street].time == 1) {
              to_push.push([next_street, car.idx]);
            }
          }
        }
      }

      for (let i=0 ; i<to_push.length ; i++)
        stacked_cars[to_push[i][0]].push(to_push[i][1]);
    }
    console.log(this.car_positions);
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
  let car_idx=0;
  for (let line of car_lines) {
    problem.cars.push(new Car(car_idx++, line.split(" ").slice(1)));
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
  fetch("data/" + filename)
  .then(response => response.text())
  .then(txt => parse_problem(txt))
  .then(pb => problem = pb)
  .then(()=>{if (typeof callback == "function") callback();});
}
document.getElementById("problem").onchange = problem_select;


let problem_names = ["a.txt", "b.txt", "c.txt", "d.txt", "e.txt", "f.txt"];
function parse_solution(file_content) {
  let sol = new Solution(problem);

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
    sol.cycles[inter_idx] = cycle;
  }

  solution = sol;
  console.log(sol);
  console.log("--- Solution loaded ---")
  sol.compute_lights();
  sol.compute_cars();
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


// ---- Debug to remove ----

let sol_txt = "3\n2\n1\nrue-de-moscou 1\n0\n1\nrue-de-londres 1\n1\n2\nrue-d-athenes 1\nrue-d-amsterdam 1\n";
document.getElementById("problem").value = "a.txt";
document.getElementById("problem").onchange(()=>{parse_solution(sol_txt);});
