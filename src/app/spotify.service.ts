import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators'; // Ajoute cette ligne pour switchMap

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private clientId = '87bb22bf134444c3875899d2b9e20c7b';  // Remplacez par votre client ID
  private clientSecret = '8b61147436e1495387343c16c1d4f10c';  // Remplacez par votre client Secret
  private accessToken = '';

  private redirectUri = 'http://localhost:4200/callback'; // Remplacez par votre URL de callback

  constructor(private http: HttpClient) {}

  private getAccessToken(): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('scope', 'playlist-read-private user-library-read'); // Ajouter scope pour accéder aux morceaux likés

    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http.post('https://accounts.spotify.com/api/token', body.toString(), { headers });
  }

  getAccessTokenValue(): string {
    return this.accessToken;
  }

  public getAuthorizationUrl(): string {
    const scopes = 'user-library-read playlist-read-private';
    return `https://accounts.spotify.com/authorize?response_type=token&client_id=${this.clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
  }

  public setAccessTokenFromRedirectUrl(url: string): void {
    const hashParams = new URLSearchParams(url.split('#')[1]);
    this.accessToken = hashParams.get('access_token') || '';
  }

  public getUserLikedTracks(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    return this.http.get('https://api.spotify.com/v1/me/tracks', { headers });
  }

  public getUserPlaylists(userId: string): Observable<any> {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.accessToken}`,
      });

      return this.http.get(`https://api.spotify.com/v1/users/${userId}/playlists`, { headers });
  }
}
