// ============================================================
//  scenePlay.js  –  Endless Run Ocong
// ============================================================

class ScenePlay extends Phaser.Scene {

    constructor() {
        super({ key: 'ScenePlay' });
    }

    preload() {
        this.load.image('bg_play',  'assets/images/fg_loop_back.png');
        this.load.image('fg_play',  'assets/images/fg_loop.png');
        this.load.image('chara',    'assets/images/chara.png');
        this.load.image('halangan', 'assets/images/obstc.png');
        this.load.image('panel',    'assets/images/panel_skor.png');

        this.load.audio('klik1', 'assets/audio/klik_1.mp3');
        this.load.audio('klik2', 'assets/audio/klik_2.mp3');
        this.load.audio('klik3', 'assets/audio/klik_3.mp3');
        this.load.audio('dead',  'assets/audio/dead.mp3');
    }

    create() {
        this.isGameRunning = false;
        this.timerHalangan = 60;
        this.halangan      = [];
        this.background    = [];
        this.charaTweens   = null;
        this.score         = 0;
        this.gameOverShown = false;

        var W = this.cameras.main.width;
        var H = this.cameras.main.height;

        // Batas atas dan bawah karakter
        this.batasAtas  = 80;
        this.batasBawah = H - 120;

        // ── PARALLAX BACKGROUND ──────────────────────────────
        var bgConfigs = [
            { key: 'bg_play', speed: 3, depth: 0 },
            { key: 'fg_play', speed: 6, depth: 1 }
        ];
        bgConfigs.forEach((cfg) => {
            var arr = [];
            for (var i = 0; i < 2; i++) {
                var obj = this.add.image(683 + i * 1366, 384, cfg.key).setDepth(cfg.depth);
                obj.setData('kecepatan', cfg.speed);
                arr.push(obj);
            }
            this.background.push(arr);
        });

        // ── KARAKTER ─────────────────────────────────────────
        this.chara = this.add.image(200, H + 100, 'chara').setDepth(5);
        this.tweens.add({
            targets:  this.chara,
            duration: 600,
            ease:     'Power2',
            y:        H / 2,
            onComplete: () => { this.isGameRunning = true; }
        });

        // ── PANEL SKOR ────────────────────────────────────────
        this.panelSkor = this.add.image(W / 2, 45, 'panel').setDepth(10);
        this.txtSkor   = this.add.text(W / 2, 45, 'SCORE: 0', {
            fontSize: '28px', fill: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);

        // ── AUDIO ─────────────────────────────────────────────
        this.sfxKlik1 = this.sound.add('klik1');
        this.sfxKlik2 = this.sound.add('klik2');
        this.sfxKlik3 = this.sound.add('klik3');
        this.sfxDead  = this.sound.add('dead');

        // ── GAME OVER OVERLAY (tersembunyi dulu) ─────────────
        this.overlayBg = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7)
            .setDepth(20).setVisible(false);

        this.txtGameOver = this.add.text(W/2, H/2 - 120, 'GAME OVER', {
            fontSize: '96px', fill: '#ff3333',
            fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.txtFinalScore = this.add.text(W/2, H/2, 'SCORE: 0', {
            fontSize: '52px', fill: '#ffffff',
            fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.txtHighScore = this.add.text(W/2, H/2 + 80, 'HIGH SCORE: 0', {
            fontSize: '40px', fill: '#ffd700',
            fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.txtNewRecord = this.add.text(W/2, H/2 + 150, '★ NEW RECORD! ★', {
            fontSize: '36px', fill: '#ff9900',
            fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.txtRestart = this.add.text(W/2, H/2 + 230, 'Klik untuk kembali ke Menu', {
            fontSize: '28px', fill: '#aaffaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        // ── FUNGSI GAME OVER ──────────────────────────────────
        this.gameOver = () => {
            if (!this.isGameRunning) return;
            this.isGameRunning = false;
            this.gameOverShown = false;

            if (this.charaTweens) this.charaTweens.stop();
            this.sfxDead.play();

            // Simpan highscore
            var highscore = parseInt(localStorage.getItem('highscore')) || 0;
            var isNewRecord = this.score > highscore;
            if (isNewRecord) {
                localStorage.setItem('highscore', this.score);
                highscore = this.score;
            }

            // Tampilkan overlay game over setelah 0.5 detik
            this.time.delayedCall(500, () => {
                this.overlayBg.setVisible(true);
                this.txtGameOver.setVisible(true);
                this.txtFinalScore.setText('SCORE: ' + this.score).setVisible(true);
                this.txtHighScore.setText('HIGH SCORE: ' + highscore).setVisible(true);
                if (isNewRecord) this.txtNewRecord.setVisible(true);
                this.txtRestart.setVisible(true);
                this.gameOverShown = true;

                // Animasi teks game over
                this.tweens.add({
                    targets: this.txtGameOver,
                    scaleX: 1.08, scaleY: 1.08,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                // Kedip teks restart
                this.tweens.add({
                    targets: this.txtRestart,
                    alpha: 0,
                    duration: 700,
                    yoyo: true,
                    repeat: -1
                });
            });
        };

        // ── INPUT ─────────────────────────────────────────────
        this.input.on('pointerup', () => {
            // Kalau game over sudah tampil, kembali ke menu
            if (this.gameOverShown) {
                this.scene.start('SceneMenu');
                return;
            }

            if (!this.isGameRunning) return;

            // Suara klik acak
            var r = Phaser.Math.Between(1, 3);
            if (r === 1) this.sfxKlik1.play();
            else if (r === 2) this.sfxKlik2.play();
            else this.sfxKlik3.play();

            // Tween turun, tapi tidak melewati batas bawah
            var targetY = Math.min(this.chara.y + 200, this.batasBawah);

            if (this.charaTweens) this.charaTweens.stop();
            this.charaTweens = this.tweens.add({
                targets:  this.chara,
                duration: 750,
                ease:     'Power1',
                y:        targetY
            });
        });
    }

    // ── UPDATE ────────────────────────────────────────────────
    update() {
        if (!this.isGameRunning) return;

        // 1. Karakter naik otomatis
        this.chara.y -= 2;

        // 2. Parallax background
        this.background.forEach((layer) => {
            layer.forEach((bg) => {
                bg.x -= bg.getData('kecepatan');
                if (bg.x < -683) bg.x += 1366 * 2;
            });
        });

        // 3. Spawn halangan
        this.timerHalangan--;
        if (this.timerHalangan <= 0) {
            this.timerHalangan = Phaser.Math.Between(60, 120);
            var posY  = Phaser.Math.Between(100, 650);
            var speed = Phaser.Math.Between(10, 15);
            var obj   = this.add.image(1500, posY, 'halangan')
                .setOrigin(0, 0.5).setDepth(4);
            obj.setData('status_aktif', true);
            obj.setData('kecepatan',    speed);
            this.halangan.push(obj);
        }

        // 4. Gerak & hapus halangan
        for (var i = this.halangan.length - 1; i >= 0; i--) {
            var h = this.halangan[i];
            h.x -= h.getData('kecepatan');
            if (h.x < -150) {
                h.destroy();
                this.halangan.splice(i, 1);
            }
        }

        // 5. Hitung skor
        this.halangan.forEach((h) => {
            if (h.getData('status_aktif') && h.x < this.chara.x) {
                h.setData('status_aktif', false);
                this.score++;
                this.txtSkor.setText('SCORE: ' + this.score);
            }
        });

        // 6. Deteksi tabrakan
        this.halangan.forEach((h) => {
            var dx = Math.abs(h.x - this.chara.x);
            var dy = Math.abs(h.y - this.chara.y);
            if (dx < 35 && dy < 35) {
                this.gameOver();
            }
        });

        // 7. Batas atas layar
        if (this.chara.y < this.batasAtas) {
            this.gameOver();
        }
    }
}