import * as Lixi from './pixi-lights.js';
import BaseContainer from './basecontainer';
import { Config } from './config';


export default class Grid extends BaseContainer {
  constructor(...args) {
    super(...args);
    this.w = Config.game.width;
    this.h = Config.game.height;
    this.centerX = Config.game.width / 2;
    this.centerY = Config.game.height / 2;
    this.drawGrid();

    this.circleDiffuseTexture = PIXI.Texture.fromImage('assets/DiffuseMap.png');
    this.circleNormalTexture = PIXI.Texture.fromImage('assets/NormalMap.png');

    this.toRemoveCircles = [];
  }

  addKey(x, y) {
    // x, y are distances from center

    let alpha = 20;

    let key = new PIXI.Graphics();
    key.lineStyle(1, 0x555555);
    key.moveTo(this.centerX + x, this.centerY + y);
    key.lineTo(this.centerX + x + x / alpha, this.centerY + y + y / alpha);

    key.interactive = true;
    key
      .on('click', this.onClick())
      .on('tap', this.onClick());

    this.add('keys', key);

    let circle = PIXI.Sprite.fromImage('assets/DiffuseMap.png');
    circle.anchor = {
      x: 0.5,
      y: 0.5
    }
    circle.x = this.centerX + x + x / alpha;
    circle.y = this.centerY + y + y / alpha;
    circle.width = 10;
    circle.height = 10;
    circle.normalTexture = PIXI.Texture.fromImage('assets/NormalMap.png');
    circle.interactive = true;
    circle
      .on('click', this.onClick())
      .on('tap', this.onClick());

    this.add('circles', circle);

    return key;
  }

  onClick() {
    return (e) => {
      let position = e.data.global;
      this.addLight(position.x, position.y);
      this.toRemoveCircles.push(e.target.name);
    };
  }

  addLight(x, y) {
    let light = new PIXI.lights.PointLight(0xffffff, 1);
    light.x = x;
    light.y = y;
    this.add('lights', light);
  }

  drawGrid() {
    for (let i = 0; i < this.w; i += 100) {
      for (let j = 0; j < this.h; j += 50) {
        this.addKey(i - this.centerX, j - this.centerY);
      }
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
      polygon.beginFill(0x939190, 0.2);
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
    this.getAll('lights').forEach((light) => {
      light.brightness += 0.1;
      if (light.brightness > 5) {
        this.blast(light.x, light.y);
        this.parent.checkCollision(light);
        this.remove('circles', this.toRemoveCircles.shift());
        this.remove('lights', light.name);
      }
    });

    this.getAll('pieces').forEach((piece) => {
      piece.x += piece.vx / 2;
      piece.y += piece.vy / 2;
      piece.count += 1;

      if (piece.count <= 20) {
        let points = piece.points;
        let newpiece = new PIXI.Graphics();
        newpiece.beginFill(0x939190, Math.random());
        newpiece.drawPolygon(points);
        newpiece.endFill();
        newpiece.lineStyle(1, 0xFFFFFF);

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
  }
}