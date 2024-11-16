import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../spotify.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})

export class WelcomeComponent implements OnInit {  
  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    const currentUrl = window.location.href;

    if (currentUrl.includes('access_token')) {
      this.spotifyService.setAccessTokenFromRedirectUrl(currentUrl);
    } else {
      window.location.href = this.spotifyService.getAuthorizationUrl();
    }
  }


}
