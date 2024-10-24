const GAME_TYPES = {
	BLITZ: "blitz",
	BULLET: "bullet",
	RAPID: "rapid",
	CLASSICAL: "classical",
	CORRESPONDENCE: "correspondence",
	UNKNOWN: "unknown",
};

// all regressions calculated from chessgoals.com on 2024/10/23
// via LibreOffice Calc
const BLITZ_REGRESSION = [
	6.25193101330584e-5, 1.08025630325128, -610.648011142447,
];
const BULLET_REGRESSION = [
	-6.8967721737e-8, 0.0004109690384, 0.4185993473529, -140.94630702249,
];
const RAPID_REGRESSION = [1.22020143441711, -704.691460754459];
const CLASSICAL_REGRESSION = [
	-0.000396331712598891, 3.03452012559305, -2662.167846144,
];

    browser.tabs.onUpdated.addListener(function(tabId, changeInfo) {
      if (changeInfo.status == "complete") {
        findGameType(tabId);
      }
    });

// distinguish between different modes using href
// it solves the issue that happens when you use other languages
const findGameType = (href) => {
	      browser.tabs.executeScript(tabId, {
        code: `
          const gameTypeElements = document.querySelectorAll("a[href*='/perf/']");
          const gameType = Array.from(gameTypeElements).map((element) => element.
  text())[0];
          return gameType;
        `,
        runAt: "document_end"
      }, (gameType) => {
        console.log(`Game type: ${gameType}`);
	const pathname = new URL(href, document.baseURI).pathname;
	const gameType = pathname.split("/perf/")[1];
	switch (gameType) {
		case "blitz":
			return GAME_TYPES.BLITZ;
		case "bullet":
			return GAME_TYPES.BULLET;
		case "rapid":
			return GAME_TYPES.RAPID;
		case "classical":
			return GAME_TYPES.CLASSICAL;
		case "correspondence":
			return GAME_TYPES.CORRESPONDENCE;
		default:
			return GAME_TYPES.UNKNOWN;
	}
};

// fetches the user's lichess rating
const getLichessRatingsFromGame = () => {
	const rating = document.querySelectorAll(".ruser > rating");
	return rating;
};

const getLichessRatingsFromProfile = () => {
	const ratings = document.querySelectorAll(".sub-ratings rating");
	return ratings;
};

// Calculates the chess.com rating based on the regression
const calculateRegression = (regression, lichessRating) => {
	if (regression.length === 2) {
		return Math.round(regression[0] * lichessRating + regression[1]);
	} else if (regression.length === 3) {
		return Math.round(
			regression[0] * (lichessRating * lichessRating) +
				regression[1] * lichessRating +
				regression[2],
		);
	} else {
		return Math.round(
			regression[0] * (lichessRating * lichessRating * lichessRating) +
				regression[1] * (lichessRating * lichessRating) +
				regression[2] * lichessRating +
				regression[3],
		);
	}
};

// Adds ratings to the left-most sidebar.
const addChessComRatingToProfile = (lichessRatings) => {
	for (rating of lichessRatings) {
		console.log(rating);
		const gameType = rating.closest("a").dataset.mode;
		let regression;
		switch (gameType) {
			case GAME_TYPES.BLITZ:
				regression = BLITZ_REGRESSION;
				break;
			case GAME_TYPES.BULLET:
				regression = BULLET_REGRESSION;
				break;
			case GAME_TYPES.RAPID:
				regression = RAPID_REGRESSION;
				break;
			case GAME_TYPES.CLASSICAL:
				regression = CLASSICAL_REGRESSION;
				break;
		}

		if (regression && rating.innerText[0] !== "?") {
			const lichessRating = parseInt(rating.textContent);
			const chessComRating = calculateRegression(regression, lichessRating);
			let chessComRatingDiv = document.createElement("span");
			chessComRatingDiv.style.setProperty("color", "#769656");
			chessComRatingDiv.innerText = ` (${chessComRating})`;
			rating.firstChild.appendChild(chessComRatingDiv);
		}
	}
};
// Adds the chess.com rating equivalent beside the lichess rating.
const addChessComRatingToGame = (gameType, lichessRatings) => {
	let regression;

	switch (gameType) {
		case GAME_TYPES.BLITZ:
			regression = BLITZ_REGRESSION;
			break;
		case GAME_TYPES.BULLET:
			regression = BULLET_REGRESSION;
			break;
		case GAME_TYPES.RAPID:
			regression = RAPID_REGRESSION;
			break;
		case GAME_TYPES.CLASSICAL:
			regression = CLASSICAL_REGRESSION;
			break;
	}

	for (rating of lichessRatings) {
		const lichessRating = parseInt(rating.innerText);
		const chessComRating = calculateRegression(regression, lichessRating);
		let chessComRatingDiv = document.createElement("div");
		chessComRatingDiv.style.setProperty("color", "#769656");
		chessComRatingDiv.innerText = `(${chessComRating})`;
		rating.parentNode.appendChild(chessComRatingDiv);
		rating.parentNode.insertBefore(chessComRatingDiv, rating.nextSibling);
	}

	return lichessRatings;
};

const gameType = findGameType();
if (gameType === GAME_TYPES.UNKNOWN) {
	// check if on a profile
	const profileRatings = getLichessRatingsFromProfile();
	addChessComRatingToProfile(profileRatings);
} else {
	// in a game, add the chess.com rating to the game
	const lichessRatings = getLichessRatingsFromGame();
	addChessComRatingToGame(gameType, lichessRatings);
}
