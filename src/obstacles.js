import BaseContainer from './basecontainer';
import { Config } from './config';


export default class Obstacles extends BaseContainer {
  constructor(...args) {
    super(...args);
    this.functions = ["t**2", "t**0.5", "sin(t)"];
    this.gap = 0;
  }

  getNewObstacle() {
    let w = Config.game.width;
    let h = Config.game.height;

    let obstacle = new PIXI.Graphics();
    obstacle.beginFill(0xF22E4B, 1);
    obstacle.drawCircle(0, 0, 10);
    obstacle.endFill();

    obstacle.startx = Math.floor(Math.random()*w);
    obstacle.starty = Math.floor(Math.random()*h);
    obstacle.x = obstacle.startx;
    obstacle.y = obstacle.starty;

    let max = 5;
    obstacle.vx = Math.floor(Math.random()*max - max/2);
    obstacle.vy = Math.floor(Math.random()*max - max/2);
    obstacle.timecount = 0;
    max = 5;
    obstacle.alphax = 0;
    obstacle.alphay = 0;

    if (Math.floor(Math.random()) == 0) {
      obstacle.alphax = Math.floor(Math.random()*max - max/2);
      if (obstacle.alphax > 0)
        obstacle.alphax += 2;
      else
        obstacle.alphax -= 2;
    }
    else {
      obstacle.alphay = Math.floor(Math.random()*max - max/2);
      if (obstacle.alphay > 0)
        obstacle.alphay += 2;
      else
        obstacle.alphay -= 2;
    }

    let num = Math.floor(Math.random()*this.functions.length);
    obstacle.distortionFn = this.functions[2];

    return obstacle;
  }

  checkCollision(p1, p2, r) {
    let dis = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    if (dis <= 4*Math.pow(r, 2))
      return true;
    return false;
  }

  fOfT(t, type) {
    t /= 10;
    switch (type) {
      case "t**2":
        return Math.pow(t, 2);
      case "sin(t)":
        return Math.sin(t, 2);
      case "t**0.5":
        return Math.pow(t, 0.5);
      default:
        return t;
    }
  }

  blast(x, y) {
    const nearbyRandomPoint = (p, dis) => {
      let point = new PIXI.Point();
      point.x = p.x + Math.floor((Math.random() - 0.5) * dis);
      point.y = p.y + Math.floor((Math.random() - 0.5) * dis);
      return point;
    };

    const getRandomPoly = () => {
      let vertices = 3 + Math.floor(Math.random()*4);

      let points = [];
      let p = new PIXI.Point(0, 0);
      for (let i = 0; i < 3; i += 1) {
        let np = nearbyRandomPoint(p, 15);
        points.push(np);
      }
      let polygon = new PIXI.Graphics();
      polygon.beginFill(0xF22E4B, 0.2);
      polygon.drawPolygon(points);
      polygon.endFill();
      polygon.lineStyle(1, 0xFFFFFF);
      polygon.moveTo(points[0].x, points[0].y);
      polygon.lineTo(points[1].x, points[1].y);
      polygon.points = points;
      return polygon;
    };

    for (let i = 0; i < 50; i += 1) {
      let piece = getRandomPoly();
      let nearby = nearbyRandomPoint({x, y}, 100);
      piece.x = x;
      piece.y = y;
      piece.vx = nearby.x - x;
      piece.vy = nearby.y - y;
      piece.count = 0;
      this.add('pieces', piece);
    }
  }

  animate() {
    this.getAll('obstacles').forEach((obs) => {
      obs.timecount += 1;

      if (obs.x > Config.game.width - 10) {
        obs.vx *= -1;
        obs.x = Config.game.width - 10;
      }
      else if (obs.x < 10) {
        obs.vx *= -1;
        obs.x = 10;
      }
      if (obs.y > Config.game.height - 10) {
        obs.vy *= -1;
        obs.y = Config.game.height - 10;
      }
      else if (obs.y < 10) {
        obs.vy *= -1;
        obs.y = 10;
      }

      obs.x += obs.vx + this.fOfT(obs.timecount, obs.distortionFn) * obs.alphax;
      obs.x -= this.fOfT(obs.timecount - 1, obs.distortionFn) * obs.alphay;
      obs.y += obs.vy + this.fOfT(obs.timecount, obs.distortionFn) * obs.alphay;
      obs.y -= this.fOfT(obs.timecount - 1, obs.distortionFn) * obs.alphay;

      obs.alpha -= (1/300);

      if (obs.timecount > 300)
        this.remove('obstacles', obs.name);
    });

    this.getAll('pieces').forEach((piece) => {
      piece.x += piece.vx / 3;
      piece.y += piece.vy / 3;
      piece.count += 1;

      if (piece.count <= 30) {
        let points = piece.points;
        let newpiece = new PIXI.Graphics();
        newpiece.beginFill(0xF22E4B, Math.random());
        newpiece.drawPolygon(points);
        newpiece.endFill();
        newpiece.lineStyle(1, 0x7f0819);

        let k = Math.floor(Math.random() * (points.length - 1));
        newpiece.moveTo(points[k].x, points[k].y);
        newpiece.lineTo(points[k+1].x, points[k+1].y);

        newpiece.x = piece.x;
        newpiece.y = piece.y;
        newpiece.count = piece.count;
        newpiece.vx = piece.vx;
        newpiece.vy = piece.vy;
        newpiece.points = piece.points;
        this.add('pieces', newpiece);
      }

      this.remove('pieces', piece.name);
    });

    this.gap += 1;

    if (this.getAll('obstacles').length < 4 && this.gap > 50) {
      this.add('obstacles', this.getNewObstacle());
      this.gap = 0;
    }
  }
}