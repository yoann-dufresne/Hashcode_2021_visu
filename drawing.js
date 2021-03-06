
class Info {
  constructor(value, color) {
    this.value = value;
    this.color = color;
  }
}

class Rectangle {
  constructor(height, color) {
    this.height = height;
    this.color = color;
  }

  draw(ctx, start_x, start_y, width, px_unit) {
    ctx.fillStyle = this.color;
    ctx.fillRect(
      start_x,
      start_y * px_unit,
      width,
      this.height * px_unit
    );
  }
}

class Track {
  constructor(info_list) {
    this.rectangles = [];

    let start = 0;
    for (let info of info_list) {
      this.rectangles.push(new Rectangle(info.value, info.color))
      start += info.value;
    }
  }

  draw(ctx, start_x, start_y, width, px_unit) {
    let y = start_y;
    for (let rect of this.rectangles) {
      rect.draw(ctx, start_x, y, width, px_unit);
      y += rect.height;
    }
  }
}

class CarTracks {
  constructor(solution) {
    this.solution = solution;
    this.tracks = [];
    this.max_time = 0;
    let journeys = solution.car_journeys;

    for (let journey of journeys) {
      let total_time = 0;
      let infos = [];

      for (let s_idx=0 ; s_idx<journey.length-1 ; s_idx++) {
        total_time += journey[s_idx];
        infos.push(new Info(journey[s_idx], s_idx % 2 == 0 ? "red" : "green"));
      }

      if (total_time > this.max_time)
        this.max_time = total_time;
      this.tracks.push(new Track(infos));
    }
  }

  draw() {
    let space = 1;
    let width = 5;
    let px_unit = 1;

    let canvas_width = this.tracks.length * (width + space); 
    let canvas_height = this.max_time * px_unit;

    var canvas = document.getElementById("car_schedule");
    canvas.style.width = canvas_width;
    canvas.style.height = canvas_height;
    var ctx = canvas.getContext("2d");
    ctx.canvas.width = canvas_width;
    ctx.canvas.height = canvas_height;

    let x=0, y=0;

    for (let track of this.tracks) {
      track.draw(ctx, x, y, width, px_unit);
      x += width + space;
    }

    ctx.fillStyle = "violet";
    ctx.fillRect(0, this.solution.pb.D, canvas_width, 3);
  }
}

class GlobalStats {
  constructor(solution) {
    this.sol = solution;
  }

  print() {
    let global_div = document.getElementById("global");
    global_div.innerHTML = "";
    let score = document.createTextNode("Score: " + this.sol.score);
    global_div.append(score);
  }
}
