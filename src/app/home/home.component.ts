import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { electron } from 'process';
import Tesseract from 'tesseract.js';
import { desktopCapturer, screen  } from 'electron';
const fs = (window as any).require('fs');
import { remote } from 'electron';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { PlayerApiResponse } from '../types';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
	ocrResult = null;
	playerName = null;
	elo = null;
	screenshot = null;
	constructor(private router: Router, private httpClient: HttpClient) {
	}
	ngOnInit(): void {
	}

	saveScreenshots(){
		desktopCapturer.getSources({
			types: ['screen'], thumbnailSize: {
				width: 2560,
				height: 1440,
			}
		})
			.then(sources => {
				this.screenshot = sources[0].thumbnail.toPNG(); // The image to display the screenshot
				fs.writeFile('/Users/thegn/Desktop/test.png', this.screenshot, err => {
					if (err) {
						console.error(err);
						return;
					}
					//file written successfully
				});
			});
	}
	recognizeImage(){
		Tesseract.recognize(
			'/Users/thegn/Desktop/test.png',
			'eng',
			{ logger: m => console.log(m) }
		).then(({ data: { text } }) => {
			console.log(text);
			this.ocrResult = text;
			this.ocrResult = 'solaire';
			this.getPlayerStats(this.ocrResult);
		});
	}

	closeApp(){
		const win = remote.getCurrentWindow();
		win.close();
	}


	getPlayerStats(playerName: string) {
		this.apiGetPlayerStats(playerName).subscribe((response) => {
			console.log(`This is the data`);
			this.elo = response.items[0].elo;
			this.playerName = response.items[0].userName;
		});
	}

	apiGetPlayerStats(playerName) {
		return this.httpClient.post<PlayerApiResponse>(`https://api.ageofempires.com/api/ageiv/Leaderboard`, {
			region: '7',
			versus: 'players',
			matchType: 'unranked',
			teamSize: '3v3',
			searchPlayer: playerName,
			page: 1,
			count: 100
		}).pipe();
	}
}
