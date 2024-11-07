import NextAuth, {AuthOptions} from "next-auth";
import Credentials from "@/auth/Credentials";

const providers= Credentials;

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile, email, credentials }:any) {
            console.log("next-auth signIn!");
            return true;
        },
        async jwt({ token, user, account, profile }:any) {
            // return token;
            console.log("next-auth jwt!");
            if(user){
                return {...token, ...user};
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            session.user = token;
            return session;
        }
    },
    pages:{
        signIn: '/login',
        newUser: '/signup'
    }

} satisfies AuthOptions;

export default async function auth(req: any, res: any) {
    return await NextAuth (req, res, authOptions);
}
