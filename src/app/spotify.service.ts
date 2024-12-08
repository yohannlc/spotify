import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private clientId = '87bb22bf134444c3875899d2b9e20c7b';
  private redirectUri = environment.redirectUri;
  private localStorageAccesToken = 'spotifyAccessToken';
  private expirationAccessToken = 'spotifyTokenExpiration';

  constructor(private http: HttpClient) {}

  public getAccessToken(): string | null {
    const expiration = localStorage.getItem(this.expirationAccessToken);
    if (expiration && Date.now() > +expiration) {
      console.log('Access token expired');
      this.clearAccessToken(); // Supprime le token expiré
      return null;
    }
    return localStorage.getItem(this.localStorageAccesToken);
  }

  public clearAccessToken(): void {
    localStorage.removeItem(this.localStorageAccesToken);
    localStorage.removeItem(this.expirationAccessToken);
  }

  public setAccessTokenFromRedirectUrl(url: string): void {
    const hashParams = new URLSearchParams(url.split('#')[1]);
    console.log('Hash params:', hashParams);
    const accessToken = hashParams.get('access_token');
    const expiresIn = hashParams.get('expires_in');

    if (accessToken && expiresIn) {
      localStorage.setItem(this.localStorageAccesToken, accessToken);
      localStorage.setItem(
        this.expirationAccessToken,
        (Date.now() + parseInt(expiresIn) * 1000).toString() // Stocker la date d'expiration
      );
    }
  }

  public regenerateAccessToken(): void {
    this.clearAccessToken();
    window.location.href = this.getAuthorizationUrl();
  }

  public getAuthorizationUrl(): string {
    const scopes = 'user-library-read playlist-read-private playlist-modify-private playlist-modify-public';
    return `https://accounts.spotify.com/authorize?response_type=token&client_id=${this.clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
  }

  public getUserPlaylists(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });

    return this.http.get(`https://api.spotify.com/v1/me/playlists`, { headers });
}

  public getUserLikedTracks(requestUrl: string | null): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    // https://api.spotify.com/v1/me/tracks
    // https://api.spotify.com/v1/playlists//tracks
    return this.http.get(requestUrl ? requestUrl : 'https://api.spotify.com/v1/playlists/7lmcXlXkKK9FzjaVdven1v/tracks', { headers });
  }

  public getPlaylistTracks(playlistId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
  }

  addTrackToPlaylist(playlistId: string, trackId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { uris: [`spotify:track:${trackId}`] }, { headers });
  }

  removeTrackFromPlaylist(playlistId: string, trackId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.delete(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers,
      body: { tracks: [{ uri: `spotify:track:${trackId}` }] },
    });
  }
  
}
