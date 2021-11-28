chrome.storage.sync.get('mode', (_mode) => {
  const mode = _mode.mode;
  ((vertNum, horiNum, shuffleTimes) => {
    // const vertNum = 2;
    // const horiNum = 3;

    const blockWidth = window.innerWidth / horiNum;
    const blockHeight = window.innerHeight / vertNum;


    let originalBody = null;
    let timerInfo = null;

    // EVA挂载了这里window,js变量在插件空间中
    function renderGame(
      imgMap,
      canvas,
    ) {
      // 新建资源
      const { Game, GameObject, resource, RESOURCE_TYPE } = EVA;
      const { RendererSystem } = EVA.plugin.renderer;
      const { Img, ImgSystem } = EVA.plugin.renderer.img;
      const { Event, EventSystem } = EVA.plugin.renderer.event;

      const goMap = new Array(vertNum);

      const game = new Game({
        systems: [
          new RendererSystem({
            canvas,
            width: window.innerWidth,
            height: window.innerHeight,
          }),
          new EventSystem({}),
          new ImgSystem(),
        ],
      });

      // 图像和地图初始化
      for (let i = 0; i < vertNum; ++i) {
        goMap[i] = [];
        for (let j = 0; j < horiNum; ++j) {
          resource.addResource([
            {
              name: `img${i}${j}`,
              type: RESOURCE_TYPE.IMAGE,
              src: {
                image: {
                  type: "jpg",
                  url: imgMap[i][j],
                },
              },
            },
          ]);
          goMap[i][j] = new GameObject(`img${i}${j}`, {
            size: { width: blockWidth, height: blockHeight },
            origin: { x: 0, y: 0 },
            position: {
              x: j * blockWidth,
              y: i * blockHeight,
            },
            anchor: {
              x: 0.5,
              y: 0.5,
            },
          });
          goMap[i][j].addComponent(
            new Img({
              resource: `img${i}${j}`,
            })
          );
          goMap[i][j].location = {
            x: j,
            y: i,
          };

          game.scene.addChild(goMap[i][j]);
        }
      }

      let startPos = null;

      // 事件初始化
      for (let i = 0; i < vertNum; ++i) {
        for (let j = 0; j < horiNum; ++j) {
          const evt = goMap[i][j].addComponent(new Event());
          evt.on("touchstart", (e) => {
            startPos = e.data.position;
          });
          evt.on("touchend", (e) => {
            if (!startPos) {
              return;
            }
            const { x: _x, y: _y } = e.data.position;
            const diffX = _x - startPos.x;
            const diffY = _y - startPos.y;

            if (Math.abs(diffX) > Math.abs(diffY)) {
              if (diffX > 0) {
                // console.warn("右");
                // 右侧移动
                // 更新goMap以及location
                moveRight(goMap, e.gameObject, (y, j) => { rerenderGo(goMap[y][j]) })
              } else {
                // console.warn("左");
                // 左侧移动
                moveLeft(goMap, e.gameObject, (y, j) => { rerenderGo(goMap[y][j]) })
              }
            } else {
              if (diffY < 0) {
                // console.warn("上");
                // 上侧移动
                moveUp(goMap, e.gameObject, (i, x) => { rerenderGo(goMap[i][x]) })
              } else {
                // 下侧移动
                // console.warn("下");
                moveDown(goMap, e.gameObject, (i, x) => { rerenderGo(goMap[i][x]) })
              }
            }

            startPos = null;
            const finish = checkEnds(goMap);
            if (finish) {
              alert(`成功复原！\n用时${timerInfo.secs}秒！`);
              canvas = null;

              document.body = originalBody;
              originalBody = null;

              clearInterval(timerInfo.timer);
              timerInfo = null;

            }
          });
        }
      }


      // 洗牌
      shuffle(goMap, shuffleTimes);
    }



    // 某一行right
    function moveRight(goMap, go, cb) {
      const y = go.location.y;
      goMap[y] = [
        ...goMap[y].slice(-1),
        ...goMap[y].slice(0, horiNum - 1),
      ];
      for (let j = 0; j < horiNum; ++j) {
        goMap[y][j].location.x = j;
        if (cb) {
          cb(y, j);
        }
      }
    }

    function moveLeft(goMap, go, cb) {
      const y = go.location.y;
      goMap[y] = [...goMap[y].slice(1), goMap[y][0]];
      for (let j = 0; j < horiNum; ++j) {
        goMap[y][j].location.x = j;
        if (cb) {
          cb(y, j);
        }
      }
    }

    function moveUp(goMap, go, cb) {
      const x = go.location.x;
      const goList = goMap.map((item) => item[x]);
      for (let i = 0; i < vertNum; ++i) {
        goMap[i][x] = goList[(i + 1) % vertNum];
        goMap[i][x].location.y = i;
        if (cb) {
          cb(i, x);
        }
      }
    }

    function moveDown(goMap, go, cb) {
      const x = go.location.x;
      const goList = goMap.map((item) => item[x]);
      for (let i = 0; i < vertNum; ++i) {
        goMap[i][x] = goList[(i - 1 + vertNum) % vertNum];
        goMap[i][x].location.y = i;
        if (cb) {
          cb(i, x);
        }
      }
    }

    function checkEnds(goMap) {
      for (let i = 0; i < vertNum; ++i) {
        for (let j = 0; j < horiNum; ++j) {
          if (goMap[i][j].name !== `img${i}${j}`) {
            return false;
          }
        }
      }
      return true;
    }


    function shuffle(goMap, times = 50) {
      const ops = [
        moveUp,
        moveLeft,
        moveDown,
        moveRight
      ];
      let op = null;
      for (let i = 0; i < times; ++i) {
        op = ops[Math.floor(4 * Math.random())];
        op(goMap, goMap[Math.floor(vertNum * Math.random())][Math.floor(horiNum * Math.random())]);
      }

      for (let i = 0; i < vertNum; ++i) {
        for (let j = 0; j < horiNum; ++j) {
          rerenderGo(goMap[i][j]);
        }
      }

    }

    // function printm(goMap) {
    //   for (let i = 0; i < goMap.length; ++i) {
    //     for (let j = 0; j < goMap[0].length; ++j) {
    //       console.log(goMap[i][j].location);
    //     }
    //     console.log("\n");
    //   }
    // }

    function rerenderGo(go) {
      const location = go.location;
      go.transform.position = {
        x: location.x * blockWidth,
        y: location.y * blockHeight,
      };
    }



    async function mainGame(b64cap) {
      const _img = new Image();
      _img.src = b64cap;

      await new Promise((resolve, reject) => {
        _img.onload = resolve;
        _img.onerror = reject;
      })


      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");


      const originWidth = _img.width / horiNum;
      const originHeight = _img.height / vertNum;

      [tempCanvas.width, tempCanvas.height] = [blockWidth, blockHeight];

      const map = new Array(vertNum);
      for (let i = 0; i < vertNum; ++i) {
        map[i] = [];
        for (let j = 0; j < horiNum; ++j) {
          tempCtx.drawImage(
            _img,
            originWidth * j,
            originHeight * i,
            originWidth,
            originHeight,
            0,
            0,
            blockWidth,
            blockHeight
          );
          const _b64 = tempCanvas.toDataURL("image/jpeg");
          map[i][j] = _b64;
        }
      }
      // 隐藏原结点
      originalBody = document.body;

      document.body = document.createElement('body');
      document.body.oncontextmenu = () => {return false}


      const renderCanvas = document.createElement("canvas");
      renderCanvas.width = window.innerWidth;
      renderCanvas.height = window.innerHeight;

      renderGame(map, renderCanvas, { vertNum, horiNum, blockWidth, blockHeight });

      document.body.appendChild(renderCanvas);

      const txt = document.createElement('span');
      txt.style = 'position: fixed; top: 5vh; left: 5vw; color: red; background-color: yellow;';
      timerInfo = {
        timer: null,
        secs: 0,
      }
      timerInfo.timer = setInterval(() => {
        timerInfo.secs += 1;
        txt.innerHTML = `用时: ${timerInfo.secs}秒`
      }, 1000);

      document.body.appendChild(txt);

    };


    const conn = chrome.runtime.connect({
      name: 'screencap'
    });
    conn.postMessage({
      msg: 'screencap'
    });

    function handler(b64img) {
      mainGame(b64img);
      conn.onMessage.removeListener(handler);
    }

    conn.onMessage.addListener(handler);
  })(mode.params.vertNums, mode.params.horiNums, mode.shuffleTimes);
})

