import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../spotify.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit {

  constructor(private spotifyService: SpotifyService) {}

  async ngOnInit(): Promise<void> {
    // 1️⃣ Si déjà connecté → ne rien faire
    const token = this.spotifyService.getAccessToken();
    if (token) return;

    // 2️⃣ Si retour Spotify avec ?code=
    const code = this.spotifyService.getAuthorizationCodeFromUrl();
    if (code) {
      await this.spotifyService.handleAuthorizationCode(code);
      window.history.replaceState({}, document.title, '/');
      return;
    }

     // 3️⃣ Sinon → rediriger vers Spotify
    await this.spotifyService.startLogin();
  }
}
