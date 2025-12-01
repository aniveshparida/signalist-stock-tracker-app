'use server';
import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";
import { findUserByEmail } from "@/lib/actions/user.action";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const sanitizedEmail = email.trim();
        const response = await auth.api.signUpEmail({
            body: { email: sanitizedEmail, password, name: fullName },
            headers: await headers()
        })

        if(response && response.user) {
            await inngest.send({
                name: 'app/user.created',
                data: { email: sanitizedEmail, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
            return { success: true, data: response }
        }

        return { success: false, error: 'Failed to create account' }
    } catch (e: any) {
        console.error('Sign up failed', e)
        const errorMessage = e?.message || e?.error?.message || 'Failed to create account. Please try again.'
        return { success: false, error: errorMessage }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const sanitizedEmail = email.trim();
        const existingUser = await findUserByEmail(sanitizedEmail);

        if(!existingUser) {
            return {
                success: false,
                errorCode: 'USER_NOT_FOUND',
                error: 'This account does not exist. Please sign up first.'
            }
        }

        const response = await auth.api.signInEmail({
            body: { email: sanitizedEmail, password },
            headers: await headers()
        })

        if(response && response.user) {
            return { success: true, data: response }
        }

        return { success: false, error: 'Invalid email or password' }
    } catch (e: any) {
        console.error('Sign in failed', e)
        const errorMessage = e?.message || e?.error?.message || 'Invalid email or password'
        return { success: false, error: errorMessage }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}