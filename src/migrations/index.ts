import * as migration_20261124_112259 from './20261124_112259';
import * as migration_20261125_133952_add_website_content from './20261125_133952_add_website_content';

export const migrations = [
  {
    up: migration_20261124_112259.up,
    down: migration_20261124_112259.down,
    name: '20261124_112259',
  },
  {
    up: migration_20261125_133952_add_website_content.up,
    down: migration_20261125_133952_add_website_content.down,
    name: '20261125_133952_add_website_content'
  },
];
