/* eslint-disable */
import test from 'tape-catch';
import Sunlight from '@deck.gl/core/effects/lighting/sunlight';

const MS_A_HOUR = 3.6e6;

test('Sunlight#azimuth', t => {
  const latitude = 49.253;
  const longitude = -123.13;
  const timestamp = 1553990400000; // 03/31/2019 @ 12:00am (UTC)

  // https://www.wolframalpha.com/input/?i=solar+position+on+20:00+03-31-2019+at+Vancouver
  const expectedAzimuth = [336.652, 60.228, 120.586, 214.551, 281.107];

  const sunlight = new Sunlight({latitude, longitude, timestamp});

  for (let i = 0; i < 5; i++) {
    const hour = i * 5;
    sunlight.setProps({timestamp: timestamp + hour * MS_A_HOUR});
    console.log(
      `Hour: ${hour}, Azimuth: actual: ${sunlight.azimuth}, expected: ${expectedAzimuth[i]}`
    );
  }

  t.end();
});

test('Sunlight#elevation', t => {
  const latitude = 49.253;
  const longitude = -123.13;
  const timestamp = 1553990400000; // 03/31/2019 @ 12:00am (UTC)

  // https://www.wolframalpha.com/input/?i=solar+position+on+20:00+03-31-2019+at+Vancouver
  const expectedElevation = [-34.107, -18.1071, 28.7654, 39.9734, -3.69685];

  const sunlight = new Sunlight({latitude, longitude, timestamp});

  for (let i = 0; i < 5; i++) {
    const hour = i * 5;
    sunlight.setProps({timestamp: timestamp + hour * MS_A_HOUR});
    console.log(
      `Hour: ${hour}, Elevation: actual: ${sunlight.elevation}, expected: ${expectedElevation[i]}`
    );
  }

  t.end();
});
