import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private clientId = '87bb22bf134444c3875899d2b9e20c7b';  // Remplacez par votre client ID
  private redirectUri = 'http://localhost:4200/callback'; // Remplacez par votre URL de callback
  private localStorageAccesToken = 'spotifyAccessToken'; // Clé pour LocalStorage

  constructor(private http: HttpClient) {}

  public getAccessToken(): string | null {
    return localStorage.getItem(this.localStorageAccesToken);
  }

  private saveAccessToken(accessToken: string): void {
    localStorage.setItem(this.localStorageAccesToken, accessToken);
  }

  public clearAccessToken(): void {
    localStorage.removeItem(this.localStorageAccesToken);
  }

  public setAccessTokenFromRedirectUrl(url: string): void {
    const hashParams = new URLSearchParams(url.split('#')[1]);
    const accessToken = hashParams.get('access_token');

    if (accessToken) {
      this.saveAccessToken(accessToken); // Stocke le token
    }
  }

  public getAuthorizationUrl(): string {
    const scopes = 'user-library-read playlist-read-private';
    return `https://accounts.spotify.com/authorize?response_type=token&client_id=${this.clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
  }

  public getUserPlaylists(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });

    return this.http.get(`https://api.spotify.com/v1/me/playlists`, { headers });
}

  public getUserLikedTracks(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });

    return this.http.get('https://api.spotify.com/v1/me/tracks', { headers });
  }

  public getPlaylistTracks(playlistId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
  }
  
}
