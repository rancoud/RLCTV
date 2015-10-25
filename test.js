var GitHubApi = require("github");
 
var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    protocol: "https",
    timeout: 5000
});

// STATS

github.repos.get({
    user: "rancoud",
    repo: "RLCTV"
}, function(err, res) {
    var stats = {
        subscribers_count: res.subscribers_count,
        open_issues_count: res.open_issues_count,
        watchers_count: res.watchers_count,
        stargazers_count: res.stargazers_count,
        forks_count: res.forks_count,
        is_fork: res.fork
    };
    console.log(stats);
});

// LAST COMMITS
function relativeDate(strdate) {
    var d = new Date(strdate).getTime();
    var n = new Date().getTime();
    var rel = Math.abs(n-d);
    var times = [
        {seconds:60 * 60 * 24 * 365 * 1000, unit:'year{s}'  },
        {seconds:60 * 60 * 24 * 30  * 1000, unit:'month{s}' },
        {seconds:60 * 60 * 24 * 7   * 1000, unit:'week{s}'  },
        {seconds:60 * 60 * 24       * 1000, unit:'day{s}'   },
        {seconds:60 * 60            * 1000, unit:'hour{s}'  },
        {seconds:60                 * 1000, unit:'minute{s}'},
        {seconds:1                  * 1000, unit:'second{s}'}
    ];
    for (var i = 0; i < times.length; i++) {
        var delta = Math.round(rel / times[i].seconds);
        if (delta >= 1) {
            if (delta == 1) {
                times[i].unit = times[i].unit.replace('{s}', '');
            }
            else {
                times[i].unit = times[i].unit.replace('{s}', 's');
            }

            return delta + ' ' + times[i].unit + ' ago';
        }
    };
}


github.repos.getCommits({
    user: "rancoud",
    repo: "RLCTV"
}, function(err, res) {
    var msg = [];
    for (var i = 0; i < res.length; i++) {
        msg.push(res[i].commit.author.name + " - " + relativeDate(res[i].commit.author.date) + ": " + res[i].commit.message);
    };
    console.log(msg);
});