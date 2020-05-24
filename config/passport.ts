import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User';

class Passport {
    constructor() {
        this.strategy();
    }

    private async strategy() {
        await passport.use(new LocalStrategy(
            {
                usernameField: 'user[email]',
                passwordField: 'user[password]'
            },
            async (email, password, done) => {
                return await this.verify(email, password, done)
            }
        ));
    }

    private async verify(email: string, password: string, done: any) {
        let user;
        try {
            user = await User.findOne({ email });
            if (!user || !user.validPassword(password)) {
                return done(null, false, { errors: { 'email or password': 'is invalid' } });
            }
            return done(null, user);
        } catch (e) {
            return done;
        }
    }
}

export default Passport;