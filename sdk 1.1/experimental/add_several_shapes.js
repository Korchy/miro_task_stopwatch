let icon24 ='<circle cx="12" cy="12" r="9" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-width="2"></circle>';

miro.onReady(
    () => {
        miro.initialize(
            {
                extensionPoints: {
                    bottomBar: {
                        title: 'Experimental',
                        svgIcon: icon24,
                        onClick: add_shapes
                    }
                }
            }
            );
    });

function add_shapes() {

    let widgets = miro.board.widgets.create([
        {
            type: 'shape',
            text: 'Shape Sample',
            x: 0,
            y: 0,
            width: 200,
            height: 50,
            style: {
                shapeType: 7,
            },
            // metadata: {
            //     ['Client Id']: {     // Digits from application settings
            //         shape: true,
            //         shapeName: 'Sample Shape Name'
            //     }
            // },
        },
        {
            type: 'image',
            url: 'https://interplanety.org/miro/img/play.svg',  // Full path to .svg with https
            x: 115,
            y: 0,
        }
    ]).then(added);
}

function added(response) {
    console.log(response[0].id);
    console.log(response[1].id);
}
