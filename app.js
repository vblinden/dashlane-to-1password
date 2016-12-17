const vue = new Vue({
    el: '#app',
    data: {
        csv: '',
        success_message: false
    },
    methods: {
        upload(event) {
            var uploaded = event.target.files || event.dataTransfer.files;
            var reader = new FileReader();
            var self = this;
            reader.onload = function () {
                self.csv = Papa.parse(reader.result);

                try {
                    self.generateNewFile();
                } catch (exception) {
                    // No error handler for now.
                }
            };

            reader.readAsBinaryString(uploaded[0]);
        },

        generateNewFile()
        {
            // Filter through the data and remove unusable items...
            this.csv.data = this.csv.data.filter((item) => {
                // Remove items with accolade...
                if (item[0].includes('{') && item[0].includes('}')) return false;

                // Remove if we have tables that contain phone or cell, these are mostly
                // on the first and third columns.
                if (this.contains(item[0], 'phone', 'cell') || this.contains(item[2], 'phone', 'cell')) return false;

                // Remove items that have more than 5 columns.
                if (item.length > 5) return false;

                // Remove items that only have one columns, these are usually
                // email fields of the user.
                if (item.length === 1) return false;

                // Remove items that are 3 columns long, these are the bank
                // fiels.
                if (item.length === 3) return false;

                // Check if more than 3 fiels are empty, those we don't need we
                // assume.
                let emptyCount = 0;
                item.forEach((column) => {
                    if (!column) emptyCount++;
                });
                if (emptyCount >= 3) return false;

                return true;
            });

            this.csv.data = _.map(this.csv.data, (item) => {
                // Move passwords to column number 4 if it's empty.
                if (!item[3] && !item[3]) {
                    item[3] = item[2];
                    item[2] = '';
                }

                // Make sure everything has atleast five columns.
                for (var i = 0; i < 5; i++) {
                    if (!item[i]) item[i] = "";
                }

                return item;
            });

            // Trigger download...
            let encoded = encodeURIComponent(Papa.unparse(this.csv.data, {
                quotes: false
            }));
            var download = document.createElement('a');
            download.setAttribute('href', 'data:text/csv;charset=utf-8,' + encoded);
            download.setAttribute('download', "1password.csv");
            document.body.appendChild(download);
            download.click();

            this.success_message = true;
        },

        contains(string, ...words) {
            if (string === undefined) return false;

            string = string.toLowerCase();
            return new RegExp(words.join('|')).test(string);
        }
    }
});
