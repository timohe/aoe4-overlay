import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { electron } from 'process';
import Tesseract from 'tesseract.js';
import { desktopCapturer, screen  } from 'electron';
const fs = (window as any).require('fs');

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
	ocrResult = null;
	screenshot = null;
	constructor(private router: Router) {
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
		});
	}
}
