// ============================================================
//  sceneMenu.js  –  Endless Run Ocong
// ============================================================

class SceneMenu extends Phaser.Scene {

    constructor() {
        super({ key: 'SceneMenu' });
    }

    preload() {
        this.load.image('bg_start',   'assets/images/bg_start.png');
        this.load.image('btn_play',   'assets/images/btn_play.png');
        this.load.image('title_game', 'assets/images/title_game.png');
        this.load.image('panel',      'assets/images/panel_skor.png');

        this.load.audio('ambience',      'assets/audio/ambience.mp3');
        this.load.audio('touch',         'assets/audio/touch.mp3');
        this.load.audio('transisi_menu', 'assets/audio/transisi_menu.mp3');
    }

    create() {
        X_POSITION.LEFT   = 0;
        X_POSITION.CENTER = this.cameras.main.width  / 2;
        X_POSITION.RIGHT  = this.cameras.main.width;

        Y_POSITION.TOP    = 0;
        Y_POSITION.CENTER = this.cameras.main.height / 2;
        Y_POSITION.BOTTOM = this.cameras.main.height;

        var highscore = localStorage.getItem('highscore') || 0;

        // Background
        this.bg = this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, 'bg_start');

        // Tombol Play
        this.btnPlay = this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, 'btn_play')
            .setDepth(10);

        // Judul Game
        this.titleGame = this.add.image(X_POSITION.CENTER, Y_POSITION.CENTER, 'title_game')
            .setDepth(10);

        // Panel Highscore
        this.panelScore = this.add.image(X_POSITION.CENTER, 50, 'panel').setDepth(10);
        this.txtHighscore = this.add.text(
            X_POSITION.CENTER, 50,
            'HIGH SCORE: ' + highscore,
            { fontSize: '28px', fill: '#ffffff', fontFamily: 'Arial' }
        ).setOrigin(0.5).setDepth(11);

        // Audio
        if (!globalAmbience) {
            globalAmbience = this.sound.add('ambience', { loop: true, volume: 0.35 });
            globalAmbience.play();
        }
        this.sfxTouch        = this.sound.add('touch');
        this.sfxTransisiMenu = this.sound.add('transisi_menu');

        // Tween titleGame turun dari atas
        this.titleGame.y = this.titleGame.y - 384;
        this.tweens.add({
            targets:  this.titleGame,
            duration: 800,
            ease:     'Bounce.easeOut',
            delay:    250,
            y:        Y_POSITION.CENTER - 180
        });

        // Tween btnPlay fade in
        this.btnPlay.setAlpha(0);
        this.tweens.add({
            targets:  this.btnPlay,
            duration: 600,
            ease:     'Power2',
            delay:    750,
            alpha:    1
        });

        // Jadikan btnPlay interaktif
        this.btnPlay.setInteractive();

        var btnClicked = false;

        this.input.on('gameobjectover', function(pointer, gameObject) {
            if (gameObject === this.btnPlay) {
                gameObject.setTint(0xdddddd);
            }
        }, this);

        this.input.on('gameobjectout', function(pointer, gameObject) {
            if (gameObject === this.btnPlay) {
                gameObject.clearTint();
            }
        }, this);

        this.input.on('gameobjectdown', function(pointer, gameObject) {
            if (gameObject === this.btnPlay) {
                btnClicked = true;
                gameObject.setTint(0x999999);
            }
        }, this);

        this.input.on('gameobjectup', function(pointer, gameObject) {
            if (gameObject === this.btnPlay && btnClicked) {
                btnClicked = false;
                gameObject.clearTint();
                this.onObjectClickEnd();
            }
        }, this);

        this.input.on('pointerup', function(pointer) {}, this);
    }

    onObjectClickEnd() {
        this.sfxTouch.play();
        this.sfxTransisiMenu.play({ delay: 0.3 });

        this.tweens.add({
            targets:  [this.bg, this.titleGame, this.btnPlay, this.panelScore, this.txtHighscore],
            duration: 400,
            ease:     'Power2',
            alpha:    0,
            onComplete: () => {
                this.scene.start('ScenePlay');
            }
        });
    }
}