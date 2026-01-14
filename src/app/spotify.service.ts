import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private clientId = '87bb22bf134444c3875899d2b9e20c7b';
  private redirectUri = environment.redirectUri;
  private localStorageAccesToken = 'spotifyAccessToken';
  private expirationAccessToken = 'spotifyTokenExpiration';
  private userId = '';

  constructor(private http: HttpClient) {}

  // 1️⃣ Vérifier si token valide
  public getAccessToken(): string | null {
    const expiration = localStorage.getItem(this.expirationAccessToken);
    if (expiration && Date.now() > +expiration) {
      this.clearAccessToken(); // Supprime le token expiré
      return null;
    }
    return localStorage.getItem(this.localStorageAccesToken);
  }

  public clearAccessToken(): void {
    localStorage.removeItem(this.localStorageAccesToken);
    localStorage.removeItem(this.expirationAccessToken);
  }

  // 2️⃣ Récupérer le code de l’URL
  public getAuthorizationCodeFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('code');
  }

  // 3️⃣ Traiter le code reçu
  async handleAuthorizationCode(code: string) {
    const verifier = localStorage.getItem('pkce_verifier');
    if (!verifier) {
      throw new Error('Missing PKCE verifier');
    }

    this.exchangeCodeForToken(code, verifier).subscribe(res => {
      localStorage.setItem('spotifyAccessToken', res.access_token);
      localStorage.setItem(
        'spotifyTokenExpiration',
        (Date.now() + res.expires_in * 1000).toString()
      );
    });
  }

  // 4️⃣ Échanger le code contre un token
  public exchangeCodeForToken(code: string, codeVerifier: string): Observable<any> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier
    });

    return this.http.post(
      'https://accounts.spotify.com/api/token',
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
  }

  // 5️⃣ Démarrer le login Spotify
  async startLogin() {
    const challenge = await this.generatePKCE();
    window.location.href = this.getAuthorizationUrl(challenge);
  }

  // 6️⃣ Générer PKCE (avant login)
  async generatePKCE() {
    const verifier = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem('pkce_verifier', verifier);

    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);

    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // 7️⃣ Construire URL Spotify
  public getAuthorizationUrl(codeChallenge: string): string {
    const scopes = 'user-library-read playlist-read-private playlist-modify-private playlist-modify-public';

    return `https://accounts.spotify.com/authorize?` +
      `client_id=${this.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;
  }

  // 8️⃣ Méthodes API Spotify...
  public getUserProfile(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
  
    return this.http.get('https://api.spotify.com/v1/me', { headers });
  }

  public getUserPlaylists(requestUrl: string | null): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });

    return this.http.get(requestUrl ? requestUrl : `https://api.spotify.com/v1/me/playlists`, { headers });
}

  public getUserLikedTracks(requestUrl: string | null): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    // https://api.spotify.com/v1/me/tracks
    // https://api.spotify.com/v1/playlists//tracks
    return this.http.get(requestUrl ? requestUrl : 'https://api.spotify.com/v1/me/tracks', { headers });
  }

  public getPlaylistTracks(playlistId: string, requestUrl: string | null): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(requestUrl ? requestUrl : `https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers });
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
