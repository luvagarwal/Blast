import * as Pixi from 'pixi.js';
import * as Lixi from './pixi-lights.js';

import './index.html';
import BaseContainer from './basecontainer';
import Spring from './spring';
import Obstacles from './obstacles';
import Grid from './grid';
import { Config } from './config';


let width = Config.game.width;
let height = Config.game.height;

const renderer = new PIXI.lights.WebGLDeferredRenderer(width,
  height, {
  antialiasing: false,
  transparent: false,
  resolution: window.devicePixelRatio,
  autoResize: true,
});

document.body.appendChild(renderer.view);

class Root extends BaseContainer {
  constructor(...args) {
    super(...args);
    this.h = height;
    this.w = width;
    this.interactive = true;

    this.mouseData = [];

    // used as a trigger for resizing
    this.containerChange = true;

    this.wavevx = 2;
    this.wavevy = 3;

    this.filesToLoad = 1;
    this.filesLoaded = 0;
    this
      .on('mousemove', this.onMouseMove())
      .on('touchmove', this.onMouseMove())
      .on('click', this.onClick())
      .on('tap', this.onClick());

    this.started = false;
    this.init();
  }

  init() {
    PIXI.loader
        .add('bg_diffuse', 'assets/BGTextureTest.jpg')
        .add('bg_normal', 'assets/BGTextureNORM.jpg')
        .add('block_diffuse', 'assets/DiffuseMap.png')
        .add('block_normal', 'assets/NormalMap.png')
        .load(() => {
          this.assetsLoaded();
        });
  }

  assetsLoaded() {
    let bg = PIXI.Sprite.fromImage('assets/BGTextureTest.jpg');
    bg.normalTexture = PIXI.Texture.fromImage('assets/BGTextureNORM.jpg');
    this.addChild(bg);

    var light = new PIXI.lights.PointLight(0xffffff, 1);
    light.position.set(525, 160);
    this.light = light;

    this.addChild(new PIXI.lights.AmbientLight(null, 0.4));
    this.addChild(new PIXI.lights.DirectionalLight(null, 1, new PIXI.Point(200, 200)));
    this.addChild(light);

    this.start();
  }

  start() {
    this.add('grid', new Grid());

    let obstacles = new Obstacles();
    this.add('obstacles', obstacles);
  }

  onClick() {
    return (e) => {
      this.pause = !this.pause;
    }
  }

  onMouseUp() {
    return (e) => {
      this.cutting = false;
      this.mouseData = [];
    };
  }

  onMouseMove() {
    return (e) => {
      let position = e.data.global;
      this.mouseData.push({
        x: position.x,
        y: position.y
      });

      /*if (this.get('bg') !== undefined) {
        let mask = new PIXI.Graphics();
        mask.beginFill();
        mask.drawCircle(position.x, position.y, 100);
        mask.endFill();
        this.get('bg').mask = mask;
      }*/

      if (this.light !== undefined) {
        this.light.x = position.x;
        this.light.y = position.y;
      }
    };
  }


  checkCollision(bomb) {
    let obsContainer = this.get('obstacles');
    for (let obs of obsContainer.getAll('obstacles')) {
      if (obsContainer.checkCollision(bomb, obs, 50)) {
        obsContainer.blast(obs.x, obs.y);
        obsContainer.remove('obstacles', obs.name);
      }
    }
  }


  animate() {
    /*if (this.get('spring') !== undefined)
      this.get('spring').animate();*/

    if (!this.started) {
      let el = document.getElementById('menu');
      if (el !== null) {
        el.style.width = `${this.w}px`;
        el.style.height = `${this.h}px`;
        el.style.display = "table";

        if (document.getElementById('start-button').value === "start") {
          this.started = true;
          el.style.display = "none";
        }
      }

      return;
    }

    if (this.get('obstacles') !== undefined)
      this.get('obstacles').animate();

    if (this.lasttime === undefined)
      this.lasttime = +new Date;
    if (+new Date - this.lasttime > 15) {
      this.lasttime = +new Date;
      this.mouseData.shift();
    }

    if (this.get('grid') !== undefined)
      this.get('grid').animate();
  }
}

const stage = new Root();

function resize(){
  let width = Math.min(800, window.innerWidth);
  let height = Math.min(450, window.innerHeight);
  renderer.resize(width, height);
  stage.w = renderer.width;
  stage.h = renderer.height;
}

function animate() {
  stage.animate();
  renderer.render(stage);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
animate();
