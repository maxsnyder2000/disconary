const functions = require("firebase-functions");
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

var Discogs = require('disconnect').Client;
var discogs = new Discogs({
	consumerKey: "XMvqJbjJIIbRNOrPUAJz",
	consumerSecret: "gTIJBkxhZQNtVVWMiwaxeDNxPfqYtYJI"
});

function sanitizeString(str) {
	return str.trimStart().trimEnd();
}

// Remove the number in parentheses
function sanitizeName(name) {
	const regex = /[\(|, ](\d+)[, \)]/;
	return sanitizeString(name.replace(regex, ''));
}

exports.getReleases = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const query = request.query.artist;
		const getReleases = new Promise((resolve, reject) => {
			discogs.database().search(query, {type: "release"}, function(err, data){
				if (err != null) {
					reject(err);
				} else {
					const results = data.results.map((result) => {
						const name_data = sanitizeString(result.title.split('-')[1]);
						const artist_data = sanitizeName(result.title.split('-')[0]);
						const imgURL_data = result.thumb;
						const releaseDate_data = result.year;
						const id_data = result.id;
						return {name: name_data, artist: artist_data, imgURL: imgURL_data, releaseDate: releaseDate_data, id: id_data};
					})
					resolve(results);	
				}
			});
		});

		const getReleasesWithCredit = new Promise((resolve, reject) => {
			discogs.database().search(null, {type: "release", credit: query}, function(err, data){
				if (err != null) {
					reject(err);
				} else {
					const results = data.results.map((result) => {
						const name_data = sanitizeString(result.title.split('-')[1]);
						const artist_data = sanitizeName(result.title.split('-')[0]);
						const imgURL_data = result.thumb;
						const releaseDate_data = result.year;
						const id_data = result.id;
						return {name: name_data, artist: artist_data, imgURL: imgURL_data, releaseDate: releaseDate_data, id: id_data};
					})
					resolve(results);	
				}
			});
		})

		return Promise.all([getReleases, getReleasesWithCredit])
			.then(([result1, result2]) => { 
				const allResults = [...result1, ...result2];

				// Merge duplicate releases by release name only if they share the same artist
				merged_dict = {};
				for (const dict of allResults) {
					const key = (dict.name).concat(dict.artist);
					if (key in merged_dict) {
						if (merged_dict[key].releaseDate > dict.releaseDate) {
							merged_dict[key] = dict; // Keep the earlier year
						}
					} else {
						merged_dict[key] = dict;
					}
				}

				// Turn back into list of Objects
				response.status(200).send(Object.keys(merged_dict).map((key) => { return merged_dict[key] }));
				
			})
			.catch((e) => { response.status(500).send(e); });
    })
});

exports.getRelease = functions.https.onRequest((request, response) => {
	cors(request, response, () => {
		const releaseId = request.query.id;
		const getRelease = new Promise((resolve, reject) => {
			discogs.database().getRelease(releaseId, function(err, data) {
				if (err != null) {
					reject(err);
				} else {
					const results = data.extraartists.map((result) => {
						return { name: sanitizeName(result.name), role: sanitizeString(result.role) }
					});

					// Merge duplicate credits by name
					merged_dict = {};
					for (const dict of results) {
						if (dict.name in merged_dict) {
							merged_dict[dict.name].push(dict.role);
						} else {
							merged_dict[dict.name] = [dict.role];
						}
					}

					// Turn back into list of Objects
					resolve(Object.keys(merged_dict).map((key) => { return { name: key, roles: merged_dict[key] }}));
				}
			})
		});

		return getRelease	
			.then(results => { response.status(200).send(results); })
			.catch((e) => { response.status(500).send(e); });
	})
});
