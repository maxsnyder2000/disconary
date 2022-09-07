const functions = require("firebase-functions");
const wiki = require('wikijs').default;
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


exports.getAlbums = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const query = request.query.artist + " discography"
        const results = [];
        wiki()
            .page(query)
            .then(page => page.links())
            .then(res => { 
                var loaded_data = 0;
                for (i in res) {
                    checkLink(res[i]).then(result => {
                        loaded_data += 1;
                        if (result != null) {
                            results.push(result);
                        }
                        if (loaded_data == res.length) {
                            response.status(200).send(results);
                        }
                    });
                }
            });
    })
});

async function checkLink(linkTitle) {
	return wiki()
		.page(linkTitle)
		.then(check_page => {
			return check_page.info().then(check_res => {
				return [check_res, check_page['fullurl']];
			});
		})
		.then(([check_res, fullURL]) => {
			if ('type' in check_res && (check_res['type'] == 'studio' || check_res['type'] == 'live')) {
				return wiki()
					.page(linkTitle)
					.then(img_page => img_page.images())
					.then(img_res => {
						const matchedImgURL = img_res.find(img => img.split('.').pop() == "png" || img.split('.').pop() == "jpg");
						return {'name': check_res['name'], 'artist' : check_res['artist'], 'imgURL' : matchedImgURL, 'releaseDate': check_res['released'].date, 'fullURL': fullURL};
					});
			} else {
				return null;
			}
		}).catch((e) => {
			return null;
		});
}

