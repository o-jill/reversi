/**
 * @fileoverview reversi gui interfaces
 */

const canvas = document.getElementById('mycanvas');
var ctx = canvas.getContext('2d');
const inp = document.getElementById('eval');
const hintt = document.getElementById('hintt');
const kifu = document.getElementById('kifu');
const btnread = document.getElementById('btnread');
const btnet = document.getElementById('btnupdate');

const cellsize = 50;
const offset = 5;
const SENTE = 1;
const GOTE = -1;
const BLANK = 0;
const NUMCELL = 8;

/* 1:黒,0:なし,-1:白*/
var cells = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, SENTE, GOTE, 0, 0, 0,
  0, 0, 0, GOTE, SENTE, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0];

var teban = SENTE;
var autocommove = 0;
var autocommatch = 0;
var atcomchk = document.getElementById('acmchk');
var atcommatchchk = document.getElementById('acmachk');
var tesuu = 1;
// var kifustr = "";
var pass = 0;

var enableclick = true;
var workerthread = new Worker('reversi_engine.js?v001');
const prgs = document.getElementById('prgs');
const prgsm = document.getElementById('prgs2');

var ntrain = 0;

function draw()
{
  ctx.fillStyle = "rgb(0, 200, 0)";
  ctx.fillRect(offset, offset, NUMCELL*cellsize, NUMCELL*cellsize);

  for (let x = 0 ; x <= NUMCELL ; ++x) {
    ctx.beginPath();
    ctx.moveTo(offset+x*cellsize, offset+0);
    ctx.lineTo(offset+x*cellsize, offset+NUMCELL*cellsize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offset+0, offset+x*cellsize);
    ctx.lineTo(offset+NUMCELL*cellsize, offset+x*cellsize);
    ctx.stroke();
  }

  for (let y = 0 ; y < NUMCELL ; ++y) {
    for (let x = 0 ; x < NUMCELL ; ++x) {
      if (cells[x+y*NUMCELL] == SENTE) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(offset+cellsize*x+cellsize*0.5, offset+cellsize*y+cellsize*0.5,
                cellsize*0.5, 0, Math.PI*2, true);
        ctx.fill();
      } else if (cells[x+y*NUMCELL] == GOTE) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(offset+cellsize*x+cellsize*0.5, offset+cellsize*y+cellsize*0.5,
                cellsize*0.5, 0, Math.PI*2, true);
        ctx.fill();
      } else {
        // never come
      }
    }
  }
}

function count(c)
{
  let sum = 0;
  for (let i = 0 ; i < NUMCELL*NUMCELL ; ++i) {
    sum += c[i];
  }
  return sum;
}

function reverse(c, xc, yc)
{
  let i, j = -1;
  let color = c[xc+yc*NUMCELL];
  let val;

  // 左
  for (i = xc ; i !== 0 ;) {
    --i;
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = j+1 ; i < xc ; ++i) {
      c[i+NUMCELL*yc] = color;
    }
  }

  // 右
  j = -1;
  for (i = xc+1 ; i < NUMCELL ; ++i) {
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = xc+1 ; i < j ; ++i) {
      c[i+NUMCELL*yc] = color;
    }
  }

  // 上
  j = -1;
  for (i = yc ; i !== 0 ;) {
    --i;
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = j+1 ; i < yc ; ++i) {
      c[xc+NUMCELL*i] = color;
    }
  }

  // 下
  j = -1;
  for (i = yc+1 ; i < NUMCELL ; ++i) {
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = yc+1 ; i < j ; ++i) {
      c[xc+NUMCELL*i] = color;
    }
  }

  // 左上
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc-i < 0 || yc-i < 0) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc-i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[xc-i+NUMCELL*(yc-i)] = color;
    }
  }

  // 右上
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc-i < 0) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc-i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[xc+i+NUMCELL*(yc-i)] = color;
    }
  }

  // 右下
  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc+i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[xc+i+NUMCELL*(yc+i)] = color;
    }
  }

  j = -1;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc-i < 0 || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc+i)];
    if (val == color) {
      j = i;
      break;
    } else if (val == BLANK) {
      break;
    }
  }
  if (j >= 0) {
    for (i = 1 ; i < j ; ++i) {
      c[(xc-i)+NUMCELL*(yc+i)] = color;
    }
  }
  return c;
}


function strteban()
{
  if (teban == SENTE) {
    return "BLACK turn";
  } else if (teban == GOTE) {
    return "WHITE turn";
  } else {
    return "Finished";
  }
}

function move(c, x, y, t)
{
  c[x+y*NUMCELL] = t;
  return reverse(c, x, y);
}

function keiseibar(c)
{
  let cnt = count(c);
  prgs.value = cnt+64;
}

function movestr(c, x, y, tb, ts, kms, tm, rfen)
{
  let str = ts.toString(10) + "手目 ";
  if (x < 0 || y < 0) {
    if (tb !== BLANK) {
      str += "パス";
    }
  } else {
    str += (x+1).toString(10) + (y+1).toString(10);
  }

  if (tb == SENTE) {
    str += " 黒 ";
  } else if (tb == GOTE) {
    str += " 白 ";
  } else {
    str += " 終了 ";
  }

  let cnt = count(c);
  str += cnt.toString(10);

  if (tb !== BLANK) {
    str += " ";
    if (kms != null && kms > 0)
      // str += kms.toString(10) + "局面";
      str += kms.toLocaleString() + "局面";
    else
      str += "1億3手";
  }

  if (tm != null && tm >= 0) {
    str += " ";
    str += tm + "msec";
  }

  if (rfen) {
    str += ' ' + rfen;
  }

  str += "\n";

  if (tb === BLANK) {
    if (cnt > 0) {
      str += "●の勝ち\n";
    } else if (cnt < 0) {
      str += "◯の勝ち\n";
    } else {
      str += "引き分け\n";
    }
  }

  return str;
}

function gotobottom(k)
{
  k.scrollTop = k.scrollHeight;
}


function onClick(e)
{
  if (!e) e = window.event; // レガシー
  if (enableclick == false)
    return;
  let bnextmove = false;
  let rect = e.target.getBoundingClientRect();
  let mousex = e.clientX-rect.left;
  let mousey = e.clientY-rect.top;
  let x = mousex-offset;
  let y = mousey-offset;
  if (x < 0 || x >= cellsize*NUMCELL || y < 0 || y >= cellsize*NUMCELL) {
    // out of the bord
  } else {
    // inp.value = x.toString(10) + "," + y.toString(10);
    let cellx = x / cellsize;
    let celly = y / cellsize;
    cellx = parseInt(cellx.toString(10));
    celly = parseInt(celly.toString(10));
    // inp.value = cellx.toString(10) + "," + celly.toString(10);
    if (cells[cellx+celly*NUMCELL] == BLANK) {
      if (checkreverse(cells, cellx, celly, teban)) {
        cells = move(cells, cellx, celly, teban);

        kifu.value += movestr(cells, cellx, celly, teban, tesuu, 0/* man */, 0, toRFEN(cells));

        ++tesuu;
        pass = 0;
        bnextmove = true;

        // 手番変更
        if (checkfinished(cells)) {
          teban = BLANK;
        } else if (teban == SENTE) {
          teban = GOTE;
        } else if (teban == GOTE) {
          teban = SENTE;
        }
      } else {
        let te = genmove(cells, teban);
        if (te.length === 0) {
          // パス→手番変更
          ++tesuu;
          ++pass;
          bnextmove = true;
          if (pass >= 2 || checkfinished(cells)) {
            teban = BLANK;
          } else if (teban == SENTE) {
            teban = GOTE;
          } else if (teban == GOTE) {
            teban = SENTE;
          }
          kifu.value += movestr(cells, -1, -1, teban, tesuu, 0/* man */, 0, toRFEN(cells));
        }
      }
    }

    if (bnextmove && teban == BLANK) {
      kifu.value += movestr(cells, -1, -1, teban, tesuu, 0, 0, toRFEN(cells));
    }
    gotobottom(kifu);
    draw();
    keiseibar(cells);
    // if (teban != BLANK && autocommmove !== 0)
    if (bnextmove && atcomchk.checked == true)
      COMmoveR();
  }
  // inp.value = evaluate(cells).toString(10) + "," + strteban();
}

/**
 * @param cells 盤の情報
 */
function checkfinished(cells)
{
  for (let c of cells) {
    if (c == BLANK) return false;
  }
  return true;
}

/**
 * @param c 盤の情報
 * @param xc チェックする座標
 * @param yc チェックする座標
 * @param color 石の色
 */
function checkreverse(c, xc, yc, color)
{
  let i, j = false;
  let rev = false;
  let val;

  // ←
  for (i = xc ; i !== 0 ;) {
    --i;
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // →
  j = false;
  rev = false;
  for (i = xc+1 ; i < NUMCELL ; ++i) {
    val = c[i+NUMCELL*yc];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ↑
  j = false;
  rev = false;
  for (i = yc ; i !== 0 ;) {
    --i;
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ↓
  j = false;
  rev = false;
  for (i = yc+1 ; i < NUMCELL ; ++i) {
    val = c[xc+NUMCELL*i];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ←↑
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc < i || yc < i) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc-i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // →↑
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc < i) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc-i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // →↓
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc+i >= NUMCELL || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc+i+NUMCELL*(yc+i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }

  // ←↓
  j = false;
  rev = false;
  for (i = 1 ; i < NUMCELL ; ++i) {
    if (xc < i || yc+i >= NUMCELL) {
      break;
    }
    val = c[xc-i+NUMCELL*(yc+i)];
    if (val == color) {
      j = rev;
      break;
    } else if (val == BLANK) {
      break;
    } else {
      rev = true;
    }
  }
  if (j) {
    return true;
  }
  return false;
}

/**
 * generate possible moves.
 *
 * @param  {[Array]}   c   board situation
 * @param  {[Integer]} tbn SENTE or GOTE
 *
 * @return {[Array]}   Array of this --> {x: x, y: y, hyoka: 9999, child:null}
 */
function genmove(c, tbn)
{
  let te = [];

  for (let i = 0 ; i < NUMCELL*NUMCELL ; ++i) {
    let val = c[i];
    if (val === BLANK) {
      let x, y;
      x = i%NUMCELL;
      y = (i-x)/NUMCELL;
      if (checkreverse(c, x, y, tbn)) {
        te.push({x: x, y: y, hyoka: 9999, child:null});
      }
    }
  }
  return te;
}

function checkResign()
{
    // よくわからんので延期
}

function COMmove()
{
  if (enableclick == false)
    return;

  enableclick = false;
  // prgs.style.display = 'none';
  prgsm.style.display = 'block';

  workerthread.postMessage({cmd: 'move', cells:cells, teban:teban, depth:3});

  draw();
}

function COMmoveR()
{
  if (enableclick == false)
    return;

  enableclick = false;
  // prgs.style.display = 'none';
  prgsm.style.display = 'block';

  workerthread.postMessage({cmd: 'move', cells:cells, teban:teban, depth:7});

  draw();
}

function init()
{
  if (enableclick == false)
    return;

  cells = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, SENTE, GOTE, 0, 0, 0,
    0, 0, 0, GOTE, SENTE, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0];

  teban = SENTE;

  tesuu = 1;
  // kifustr = "";
  pass = 0;

  kifu.value = "";
  inp.value = "";
  draw();
}

function AutoCOMMove()
{
  autocommove = 1-autocommove;
  inp.text = "" + autocommove;
}

function AutoCOMMatch()
{
  autocommatch = 1-autocommatch;
  inp.text = "" + autocommatch;
}

function hint()
{
  let te = genmove(cells, teban);
  let sz = te.length;
  let txt = "";
  for (let i = 0 ; i < sz ; ++i) {
    let x = te[i].x;
    let y = te[i].y;
    txt += "(" + x + "," + y + "),";
  }
  inp.value = txt;
}

workerthread.onmessage = function(e)
{
  let cmd = e.data.cmd;
  if (cmd == 'evaltbl') {
    let et = e.data.evaltbl;
    hintt.value = et.join(',');
    return;
  }
  if (cmd == 'train') {
    --ntrain;
    if (ntrain == 0) {
      // window.alert('training done!');
      btnread.disabled = false;
    }
    return;
  }
  if (cmd == 'newevaltbl') {
    btnet.disables = false;
    return;
  }
  let hinto = e.data.hinto;
  let kyokumensu = e.data.kyokumensu;
  let duration = e.data.duration;
  let hyoka = e.data.hyoka;

  let x = -1, y = -1;
  if (hinto != null) {
    x = hinto.x;
    y = hinto.y;
  } else {
    // pass
  }

  if (x >= 0 && y >= 0) {
    move(cells, x, y, teban);
    pass = 0;
  } else {
    // pass
    ++pass;
  }

  kifu.value += movestr(cells, x, y, teban, tesuu, kyokumensu, duration, toRFEN(cells));

  ++tesuu;
  // 手番変更
  if (pass >= 2 || checkfinished(cells)) {
    teban = BLANK;
  } else if (teban == SENTE) {
    teban = GOTE;
  } else if (teban == GOTE) {
    teban = SENTE;
  }
  draw();
  keiseibar(cells);

  enableclick = true;
  // prgs.style.display = 'block';
  prgsm.style.display = 'none';

  if (atcommatchchk.checked == true && teban != BLANK) {
    COMmoveR();
  } else {
    if (teban == BLANK) {
      kifu.value += movestr(cells, -1, -1, teban, tesuu, 0, 0, toRFEN(cells));
    }
  }
  if (hinto != null) {
    let str = "";
    let temban = -teban;
    for (let node = hinto ; node != null ; node = node.best) {
      if (temban == SENTE)
        str += "●(";
      else if (temban == GOTE)
        str += "◯(";

      str += node.x.toString(10) + "," + node.y.toString(10) + ") ";
      temban = -temban;
    }

    hintt.value = str;
  }
  gotobottom(kifu);
}

/**
 * 棋譜をファイルに保存。
 * @return {[type]} [description]
 */
function fsave()
{
  let content = kifu.value;
  let blob = new Blob([content], {"type" : "text/plain"});
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, "kifu.txt");

    // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
    window.navigator.msSaveOrOpenBlob(blob, "kifu.txt");
  } else {
    document.getElementById("download").href = window.URL.createObjectURL(blob);
  }
}

function ___init()
{
  draw();
}

___init();

function copykifu()
{
  kifu.select();
  document.execCommand('copy');
}

function showevaltbl()
{
  workerthread.postMessage({ cmd: 'evaltbl' });
}

function readkifu()
{
  btnread.disabled = true;

  let result = kifu.value;
  let lines = result.split('\n');
  let moves = [];
  let rfen = [];
  for (let l of lines) {
    let elem = l.split(' ');
    moves.push(Number(elem[1]));
    rfen.push(elem.slice(-1)[0]);
  }
  // console.log("moves:" + moves.join(' '));

  let output = NaN;
  if (result.indexOf("●の勝ち") >= 0) {
    // console.log("BLACK WON");
    output = SENTE;
  } else if (result.indexOf("◯の勝ち") >= 0) {
    // console.log("WHITE WON");
    output = GOTE;
  } else if (result.indexOf("引き分け") >= 0) {
    // console.log("DRAW");
    output = 0;
  } else {
    // console.log("UNKNOWN");
    return;
  }
  ntrain = rfen.length;
  teban = SENTE;
  for (let i = 0 ; i < rfen.length ; ++i) {
    if (isNaN(moves[i])) {
      --ntrain;
      continue;
    }

    workerthread.postMessage(
      {
        cmd: 'train', cells: fromRFEN(rfen[i]),
        teban: teban, output: output, eta: 0.001
      }
    );
    teban = -teban;
  }
}

const BLACKN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', '*',];
const WHITEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '*',];

function toRFEN(cells)
{
  let result = new Array(NUMCELL);
  for (let i = 0; i < NUMCELL; ++i) {
    let line = '';
    let c = cells[i * NUMCELL];
    let l = 0;
    for (let j = 1; j < NUMCELL; ++j) {
      if (c == cells[i * NUMCELL + j]) {
        ++l;
        continue;
      }
      if (c == SENTE) {
        line += BLACKN[l];
      } else if (c == GOTE) {
        line += WHITEN[l];
      } else if (c == BLANK) {
        line += '' + (l + 1);
      }
      c = cells[i * NUMCELL + j];
      l = 0;
    }

    if (c == SENTE) {
      line += BLACKN[l];
    } else if (c == GOTE) {
      line += WHITEN[l];
    } else if (c == BLANK) {
      line += '' + (l + 1);
    }
    result[i] = line;
  }

  return result.join('/');
}

const NBLACK = "ABCDEFGH";
const NWHITE = "abcdefgh";
const RFEN_START = "8/8/8/3Aa3/3aA3/8/8/8";

function fromRFEN(rfen)
{
  let cells = new Array(NUMCELL * NUMCELL);
  let icell = 0;

  for (let i = 0; i < rfen.length; ++i) {
    let ch = rfen[i];
    let j = NBLACK.indexOf(ch);
    if (j >= 0) {
      while( j >= 0 ) {
        cells[icell] = SENTE;
        ++icell;
        --j;
      }
      continue;
    }
    j = NWHITE.indexOf(ch);
    if (j >= 0) {
      while (j >= 0) {
        cells[icell] = GOTE;
        ++icell;
        --j;
      }
      continue;
    }
    j = Number(ch);
    if (!isNaN(j)) {
      while (j > 0) {
        cells[icell] = BLANK;
        ++icell;
        --j;
      }
      continue;
    }
  }
  return cells;
}

function updateevaltbl()
{
  btnet.disables = true;
  let et = hintt.value.split(',');
  workerthread.postMessage({ cmd: 'newevaltbl', evaltbl: et });
}