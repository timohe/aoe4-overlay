import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { electron } from 'process';
import Tesseract from 'tesseract.js';
import { desktopCapturer, screen } from 'electron';
const fs = (window as any).require('fs');
const sharp = (window as any).require('sharp');
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
	playerName = 'undefined';
	elo = null;
	screenshot = null;
	png = null;
	croppedImage = null;


	constructor(private router: Router, private httpClient: HttpClient) {
	}
	ngOnInit(): void {
	}


	testCropImage() {
		desktopCapturer.getSources({
			types: ['screen'], thumbnailSize: {
				width: 2560,
				height: 1440,
			}
		})
			.then(sources => {
				this.screenshot = sources[0].thumbnail.toPNG(); // The image to display the screenshot
				const imageBuffer = Buffer.from(this.screenshot);
				sharp(imageBuffer)
					.resize(200)
					.toFile('/Users/timo/Desktop/picture.png', (err, info) => { console.log(`This is the data`)});
	});
}


saveScreenshotsAndRecognize() {
	desktopCapturer.getSources({
		types: ['screen'], thumbnailSize: {
			width: 2560,
			height: 1440,
		}
	})
		.then(sources => {
			this.screenshot = sources[0].thumbnail.toPNG(); // The image to display the screenshot
			const imageBuffer = Buffer.from(this.screenshot);
			Tesseract.recognize(
				imageBuffer,
				'eng',
				{ logger: m => console.log(m) }
			).then(({ data: { text } }) => {
				console.log(text);
				// this.playerName = text;
				// this.ocrResult = text;
				// this.ocrResult = 'solaire';
				// this.getPlayerStats(this.ocrResult);
			});
		});
}
// recognizeImage() {
// 	fs.readFile('/Users/timo/Desktop/picture.png', function(err, data) {
// 		if (err) {throw err;};
// 	});
// }

closeApp() {
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
