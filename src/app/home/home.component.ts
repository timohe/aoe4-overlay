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
import { PlayerApiResponse, PlayerStats, GameMode } from '../types';
import { StaticSymbol } from '@angular/compiler';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
	nameXOffset = 168;
	nameYOffset = [288, 365, 444, 527, 602, 685];
	nameWidth = 400;
	nameHeight = 50;
	playerStats: Array<PlayerStats> = [];
	calcInProgress = false;
	fakeInput = true;

	constructor(private httpClient: HttpClient, private native: ElectronService) {
	}
	ngOnInit(): void {
	}

	// main function to trigger all logic
	async getStatsForAll(){
		this.playerStats = [];
		this.calcInProgress = true;
		for (let i = 0; i < this.nameYOffset.length; i++) {
			const playerName = await this.getPlayerNameFromScreenshot(i, this.fakeInput, true);
			const playerStat = await this.getStatsFromName(playerName, GameMode.vs3);
			if (playerStat){
				this.playerStats[i] = playerStat;
			}
		}
		this.calcInProgress = false;
		console.log(this.playerStats);
	}

	async getPlayerNameFromScreenshot(playerNumber: number, fakeInput: boolean, enhanceImage: boolean): Promise<string> {
		let buffer = null;
		if (fakeInput){
			buffer = await this.getBufferFromLocalFile();
		} else {
			buffer = await this.getScreenshot();
		}
		let cropped = await this.cropPicture(buffer, this.nameWidth, this.nameHeight, this.nameXOffset, this.nameYOffset[playerNumber]);
		// eslint-disable-next-line max-len
		if (enhanceImage){
			cropped = await this.improveImage(cropped);
		}
		// await this.savePicture(cropped, playerNumber);
		return await this.recognizeTextFromBuffer(cropped);
	}

	async getStatsFromName(playerName: string, preferredGameMode: GameMode): Promise<PlayerStats>{
		let stats = await this.getPlayerStatsFromApi(playerName, preferredGameMode);
		if (stats && stats.count && stats.count === 1) {
			return stats.items[0];
		}
		stats = await this.getPlayerStatsFromApi(playerName, GameMode.vs3);
		if (stats && stats.count && stats.count === 1) {
			return stats.items[0];
		}
		stats = await this.getPlayerStatsFromApi(playerName, GameMode.vs2);
		if (stats && stats.count && stats.count === 1) {
			return stats.items[0];
		}
		stats = await this.getPlayerStatsFromApi(playerName, GameMode.vs1);
		if (stats && stats.count && stats.count === 1) {
			return stats.items[0];
		}
		stats = await this.getPlayerStatsFromApi(playerName, GameMode.vs4);
		if (stats && stats.count && stats.count === 1) {
			return stats.items[0];
		}
	}

	async greyscaleImage(picture: Buffer){
		const greyscale = await this.native.sharp(picture)
			.greyscale()
			.toBuffer();
		return greyscale;
	}

	async blurImage(picture: Buffer) {
		const blurred = await this.native.sharp(picture)
			.blur(0.8)
			.toBuffer();
		return blurred;
	}

	async improveImage(picture: Buffer) {
		const greyscale = await this.native.sharp(picture)
			.threshold(100)
			.negate({ alpha: false })
			.blur(0.5)
			.toBuffer();
		return greyscale;
	}

	async getBufferFromLocalFile(): Promise<Buffer> {
		const result = await this.native.fs.promises.readFile('./src/assets/test-screenshot/2v2.png');
		return Buffer.from(result);
	}

	async recognizeTextFromBuffer(picture: Buffer): Promise<string> {
		const text = await Tesseract.recognize(picture, 'eng');
		console.log(`Recognized player:`);
		console.log(text.data.text);
		return text.data.text;
	}

	async cropPicture(picture: Buffer, nameWidth: number, nameHeight: number, xOffset: number, yOffset: number) {
		const cropped = await this.native.sharp(picture)
			.extract({ width: nameWidth, height: nameHeight, left: xOffset, top: yOffset })
			.toBuffer();
		return cropped;
	}

	// eslint-disable-next-line max-len
	async savePicture(picture: Buffer, playerNumber: number) {
		await this.native.sharp(picture)
			.toFile(`./src/assets/test-screenshot/picture_cropped_${playerNumber}.png`);
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

	async getPlayerStatsFromApi(playerName: string, mode: string) {
		const trimmedPlayerName = playerName.trim();
		return this.httpClient.post<PlayerApiResponse>(`https://api.ageofempires.com/api/ageiv/Leaderboard`, {
			region: '7',
			versus: 'players',
			matchType: 'unranked',
			teamSize: mode,
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
