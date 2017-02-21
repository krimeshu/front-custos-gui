import { foo } from './lib/small-module';
import { foo as foo2 } from './lib/sub-module';

setTimeout(() => {
    foo();
    foo2();
}, 50);