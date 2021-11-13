import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { electron } from 'process';
import Tesseract from 'tesseract.js';
import { desktopCapturer, screen } from 'electron';
import { ElectronService } from '../core/services/index';
import { remote } from 'electron';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { PlayerApiResponse, PlayerStats } from '../types';
import { StaticSymbol } from '@angular/compiler';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
	playerNamePositionXOffset = 168;
	playerNamePositionYOffset = [288, 365, 444, 527, 602, 685];
	playerNameWidth = 400;
	playerNameHeight = 50;
	playerStats = [];

	constructor(private httpClient: HttpClient, private native: ElectronService) {
	}
	ngOnInit(): void {
	}

	async getStatsForAll(){
		for (let i = 0; i < this.playerNamePositionYOffset.length; i++) {
			const playerStat = await this.getStatsFromScreenshotForOne(i);
			if (playerStat){
				this.playerStats[i] = playerStat;
			}
		}
		console.log(this.playerStats);
	}

	// main function to trigger all logic
	async getStatsFromScreenshotForOne(playerNumber: number): Promise<PlayerStats> {
		//TODO: replace this with the screenshot function
		const buffer = await this.getBufferFromLocalFile();
		// eslint-disable-next-line max-len
		const cropped = await this.cropPicture(buffer, this.playerNameWidth, this.playerNameHeight, this.playerNamePositionXOffset, this.playerNamePositionYOffset[playerNumber]);
		// eslint-disable-next-line max-len
		await this.cropPictureToFile(buffer, playerNumber, this.playerNameWidth, this.playerNameHeight, this.playerNamePositionXOffset, this.playerNamePositionYOffset[playerNumber]);
		const playerName = await this.recognizeTextFromBuffer(cropped);
		const stats = await this.getPlayerStatsFromApi(playerName);
		if (stats && stats.count && stats.count === 1){
			return stats.items[0];
		} else {
			return null;
		}
	}

	async getBufferFromLocalFile(): Promise<Buffer> {
		const result = await this.native.fs.promises.readFile('/Users/timo/Desktop/test.png');
		return Buffer.from(result);
	}

	async recognizeTextFromBuffer(picture: Buffer): Promise<string> {
		const text = await Tesseract.recognize(picture, 'eng');
		return text.data.text;
	}

	async cropPicture(picture: Buffer, nameWidth: number, nameHeight: number, xOffset: number, yOffset: number) {
		const cropped = await this.native.sharp(picture)
			.extract({ width: nameWidth, height: nameHeight, left: xOffset, top: yOffset })
			.toBuffer();
		return cropped;
	}

	// eslint-disable-next-line max-len
	async cropPictureToFile(picture: Buffer, playerNumber: number, nameWidth: number, nameHeight: number, xOffset: number, yOffset: number) {
		await this.native.sharp(picture)
			.extract({ width: nameWidth, height: nameHeight, left: xOffset, top: yOffset })
			.toFile(`/Users/timo/Desktop/picture_cropped_${playerNumber}.png`);
	}

	async getScreenshot(): Promise<Buffer> {
		const sources = await desktopCapturer.getSources({
			types: ['screen'], thumbnailSize: {
				width: 2560,
				height: 1440,
			}
		});
		const screenshot = sources[0].thumbnail.toPNG();
		return Buffer.from(screenshot);
	}

	async getPlayerStatsFromApi(playerName: string) {
		const trimmedPlayerName = playerName.trim();
		return this.httpClient.post<PlayerApiResponse>(`https://api.ageofempires.com/api/ageiv/Leaderboard`, {
			region: '7',
			versus: 'players',
			matchType: 'unranked',
			teamSize: '3v3',
			searchPlayer: trimmedPlayerName,
			page: 1,
			count: 100
		}).toPromise();
	}

	closeApp() {
		const win = remote.getCurrentWindow();
		win.close();
	}
}
