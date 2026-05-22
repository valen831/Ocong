// ============================================================
//  scenePlay.js  –  Endless Run Ocong
//  Perubahan:
//    - Mekanik lompat gaya Flappy Bird (setiap klik = dorongan ke atas)
//    - Batas atas TIDAK mematikan (karakter bisa naik sampai langit)
//    - Fullscreen-aware (ukuran dari game config)
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
        this.score         = 0;
        this.gameOverShown = false;

        // ── FISIKA GAYA FLAPPY BIRD ───────────────────────────
        // Setiap klik selalu memberi dorongan ke atas (jumpForce).
        // Tidak ada batas atas; karakter bisa terbang ke langit.
        this.velocityY = 0;
        this.gravity   = 0.35;     // gravitasi ringan agar melayang lebih lama
        this.jumpForce = -13;      // dorongan kuat ke atas seperti Flappy Bird asli

        var W = this.cameras.main.width;
        var H = this.cameras.main.height;

        // Batas bawah saja (tanah) — sentuh tanah = mati
        this.batasBawah = H - 80;

        // Batas atas hanya untuk clamp visual, tidak mematikan
        this.batasAtas  = 0;

        // ── PARALLAX BACKGROUND ──────────────────────────────
        var halfW = W / 2;
        var bgConfigs = [
            { key: 'bg_play', speed: 3, depth: 0 },
            { key: 'fg_play', speed: 6, depth: 1 }
        ];
        bgConfigs.forEach((cfg) => {
            var arr = [];
            for (var i = 0; i < 2; i++) {
                var obj = this.add.image(halfW + i * W, H / 2, cfg.key)
                    .setDepth(cfg.depth)
                    .setDisplaySize(W, H);
                obj.setData('kecepatan', cfg.speed);
                arr.push(obj);
            }
            this.background.push(arr);
        });

        // ── KARAKTER (masuk dari atas dengan bounce) ─────────
        this.chara = this.add.image(W * 0.2, -100, 'chara').setDepth(5);
        this.tweens.add({
            targets:  this.chara,
            duration: 600,
            ease:     'Bounce.easeOut',
            y:        H / 2,
            onComplete: () => {
                this.velocityY     = 0;
                this.isGameRunning = true;
            }
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

        // ── GAME OVER OVERLAY ─────────────────────────────────
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

            this.velocityY = 0;
            this.sfxDead.play();

            var highscore   = parseInt(localStorage.getItem('highscore')) || 0;
            var isNewRecord = this.score > highscore;
            if (isNewRecord) {
                localStorage.setItem('highscore', this.score);
                highscore = this.score;
            }

            this.time.delayedCall(500, () => {
                this.overlayBg.setVisible(true);
                this.txtGameOver.setVisible(true);
                this.txtFinalScore.setText('SCORE: ' + this.score).setVisible(true);
                this.txtHighScore.setText('HIGH SCORE: ' + highscore).setVisible(true);
                if (isNewRecord) this.txtNewRecord.setVisible(true);
                this.txtRestart.setVisible(true);
                this.gameOverShown = true;

                this.tweens.add({
                    targets: this.txtGameOver,
                    scaleX: 1.08, scaleY: 1.08,
                    duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                this.tweens.add({
                    targets: this.txtRestart,
                    alpha: 0, duration: 700, yoyo: true, repeat: -1
                });
            });
        };

        // ── INPUT ─────────────────────────────────────────────
        this.input.on('pointerup', () => {
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

            // ── FLAPPY BIRD: setiap klik = dorongan ke atas ──
            this.velocityY = this.jumpForce;
        });

        // Keyboard spacebar juga bisa dipakai
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.gameOverShown) {
                this.scene.start('SceneMenu');
                return;
            }
            if (!this.isGameRunning) return;
            this.velocityY = this.jumpForce;
        });
    }

    // ── UPDATE ────────────────────────────────────────────────
    update() {
        if (!this.isGameRunning) return;

        var W = this.cameras.main.width;
        var H = this.cameras.main.height;

        // 1. Gravitasi & gerak vertikal karakter (Flappy Bird style)
        this.velocityY  += this.gravity;
        this.chara.y    += this.velocityY;

        // 2. Parallax background
        this.background.forEach((layer) => {
            layer.forEach((bg) => {
                bg.x -= bg.getData('kecepatan');
                if (bg.x < -(W / 2)) bg.x += W * 2;
            });
        });

        // 3. Spawn halangan
        this.timerHalangan--;
        if (this.timerHalangan <= 0) {
            this.timerHalangan = Phaser.Math.Between(60, 120);
            var posY  = Phaser.Math.Between(H * 0.15, H * 0.85);
            var speed = Phaser.Math.Between(10, 15);
            var obj   = this.add.image(W + 50, posY, 'halangan')
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

        // 6. Deteksi tabrakan dengan halangan
        this.halangan.forEach((h) => {
            var dx = Math.abs(h.x - this.chara.x);
            var dy = Math.abs(h.y - this.chara.y);
            if (dx < 35 && dy < 35) {
                this.gameOver();
            }
        });

        // 7. Batas layar
        // Batas atas: clamp saja, TIDAK mati (bisa terbang ke langit)
        if (this.chara.y < this.batasAtas) {
            this.chara.y   = this.batasAtas;
            this.velocityY = 0; // hentikan momentum saat mentok atas
        }

        // Batas bawah: tanah = pijakan, tidak mati
        if (this.chara.y >= this.batasBawah) {
            this.chara.y   = this.batasBawah;
            this.velocityY = 0;
        }
    }
}