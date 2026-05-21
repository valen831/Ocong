// ============================================================
//  scenePlay.js  –  Endless Run Ocong
// ============================================================

class ScenePlay extends Phaser.Scene {

    constructor() {
        super({ key: 'ScenePlay' });
    }

    preload() {
        // Background parallax
        this.load.image('bg_play', 'assets/images/fg_loop_back.png');
        this.load.image('fg_play', 'assets/images/fg_loop.png');

        // Karakter
        this.load.image('chara', 'assets/images/chara.png');

        // Halangan / obstacle
        this.load.image('halangan', 'assets/images/obstc.png');

        // Panel skor
        this.load.image('panel', 'assets/images/panel_skor.png');

        // Audio
        this.load.audio('klik1', 'assets/audio/klik_1.mp3');
        this.load.audio('klik2', 'assets/audio/klik_2.mp3');
        this.load.audio('klik3', 'assets/audio/klik_3.mp3');
        this.load.audio('dead',  'assets/audio/dead.mp3');
    }

    create() {

        // ======================================================
        // STATE VARIABLES
        // ======================================================
        this.isGameRunning = false;
        this.timerHalangan = 60;
        this.halangan      = [];
        this.background    = [];
        this.charaTweens   = null;
        this.score         = 0;

        // ======================================================
        // PARALLAX BACKGROUND
        // ======================================================
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

        // ======================================================
        // KARAKTER
        // ======================================================
        this.chara = this.add.image(200, 900, 'chara').setDepth(5);

        this.tweens.add({
            targets:  this.chara,
            duration: 600,
            ease:     'Power2',
            y:        384,
            onComplete: () => {
                this.isGameRunning = true;
            }
        });

        // ======================================================
        // PANEL SKOR
        // ======================================================
        this.panelSkor = this.add.image(683, 50, 'panel').setDepth(10);
        this.txtSkor   = this.add.text(683, 50, 'SCORE: 0', {
            fontSize:   '28px',
            fill:       '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(11);

        // ======================================================
        // AUDIO
        // ======================================================
        this.sfxKlik1 = this.sound.add('klik1');
        this.sfxKlik2 = this.sound.add('klik2');
        this.sfxKlik3 = this.sound.add('klik3');
        this.sfxDead  = this.sound.add('dead');

        // ======================================================
        // FUNGSI GAME OVER
        // ======================================================
        this.gameOver = () => {
            if (!this.isGameRunning) return;
            this.isGameRunning = false;

            if (this.charaTweens) {
                this.charaTweens.stop();
            }

            this.sfxDead.play();

            // Simpan highscore
            var highscore = parseInt(localStorage.getItem('highscore')) || 0;
            if (this.score > highscore) {
                localStorage.setItem('highscore', this.score);
            }

            // Kembali ke menu setelah 2 detik
            this.time.delayedCall(2000, () => {
                this.scene.start('SceneMenu');
            });
        };

        // ======================================================
        // INPUT: klik untuk turunkan karakter
        // ======================================================
        this.input.on('pointerup', () => {
            if (!this.isGameRunning) return;

            // Mainkan suara klik secara acak
            var r = Phaser.Math.Between(1, 3);
            if (r === 1) this.sfxKlik1.play();
            else if (r === 2) this.sfxKlik2.play();
            else this.sfxKlik3.play();

            // Tween karakter turun 200 px
            this.charaTweens = this.tweens.add({
                targets:  this.chara,
                duration: 750,
                ease:     'Power1',
                y:        this.chara.y + 200
            });
        });
    }

    // ----------------------------------------------------------
    //  UPDATE
    // ----------------------------------------------------------
    update() {

        if (!this.isGameRunning) return;

        // 1. Karakter naik otomatis
        this.chara.y -= 2;

        // 2. Parallax background bergerak
        this.background.forEach((layer) => {
            layer.forEach((bg) => {
                bg.x -= bg.getData('kecepatan');
                if (bg.x < -683) {
                    bg.x += 1366 * 2;
                }
            });
        });

        // 3. Spawn halangan
        this.timerHalangan--;
        if (this.timerHalangan <= 0) {
            this.timerHalangan = Phaser.Math.Between(60, 120);

            var posY  = Phaser.Math.Between(60, 680);
            var speed = Phaser.Math.Between(10, 15);

            var obj = this.add.image(1500, posY, 'halangan')
                .setOrigin(0, 0.5)
                .setDepth(4);

            obj.setData('status_aktif', true);
            obj.setData('kecepatan',    speed);

            this.halangan.push(obj);
        }

        // 4. Gerakkan & hapus halangan keluar layar
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
            if (!h.getData('status_aktif')) return; // sudah terlewati, skip
            var dx = Math.abs(h.x - this.chara.x);
            var dy = Math.abs(h.y - this.chara.y);
            if (dx < 35 && dy < 35) {
                this.gameOver();
            }
        });

        // 7. Batas atas layar
        if (this.chara.y < 0) {
            this.gameOver();
        }
    }
}