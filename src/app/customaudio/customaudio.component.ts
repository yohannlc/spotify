import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-customaudio',
  templateUrl: './customaudio.component.html',
  styleUrls: ['./customaudio.component.css'],
  standalone: true,
  imports: [],
})
export class CustomAudioComponent {
  @Input() audioSrc: string = ''; // URL de l'audio

  private audio = new Audio();
  currentTime = '0:00';
  duration = '0:00';

  playAudio() {
    this.audio.src = this.audioSrc;
    this.audio.play();
    this.audio.ontimeupdate = () => {
      this.currentTime = this.formatTime(this.audio.currentTime);
      this.duration = this.formatTime(this.audio.duration);
    };
  }

  pauseAudio() {
    this.audio.pause();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
  }
}
