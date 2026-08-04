function getCountdown() {

    const target = new Date("2026-08-08T19:00:00+05:30").getTime();
    const now = Date.now();

    let diff = target - now;

    if (diff <= 0) {

        return {
            live: true,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };

    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff %= (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff %= (1000 * 60 * 60);

    const minutes = Math.floor(diff / (1000 * 60));
    diff %= (1000 * 60);

    const seconds = Math.floor(diff / 1000);

    return {

        live: false,

        days,

        hours,

        minutes,

        seconds

    };

}

module.exports = getCountdown;