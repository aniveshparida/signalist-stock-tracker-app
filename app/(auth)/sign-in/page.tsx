'use client'

import {useForm} from 'react-hook-form'
import {Button} from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import {signInWithEmail} from "@/lib/actions/auth.action";
import {toast} from "sonner"
import {signInEmail} from "better-auth/api";
import {useRouter} from "next/navigation";

const SignIn =()=>{
    const router = useRouter();
    const{
        register,
        handleSubmit,
        formState: {errors,isSubmitting},
    }=useForm<SignInFormData>({
        defaultValues:{
            email:'',
            password:'',
        },
        mode:'onBlur',
    });

    const onSubmit = async (data:SignInFormData) => {
        try{
            const result=await signInWithEmail(data);
            if(result.success){
                toast.success('Signed in successfully!');
                // Add a slight delay before redirecting to ensure auth state is updated
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                }, 500);
            } else {
                const message = result.errorCode === 'USER_NOT_FOUND'
                    ? 'This account does not exist. Please sign up first.'
                    : (result.error || 'Invalid email or password');
                toast.error('Sign In failed', {
                    description: message
                });
            }
        }catch(e){
            console.error(e);
            toast.error('Sign In failed',{
                description:e instanceof Error ?e.message:'Failed to sign in'
            });
        }
    }

    return (
        <>
            <h1 className="form-title">Welcome back</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                 name="email"
                 label="Email"
                 placeholder="contact@parida.com"
                 register={register}
                 error={errors.email}
                 validation={{required:'Email is required',pattern:/^\w+@\w+\.\w+/}}
                />
                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{required:'Password is required',minLength:8}}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting?'Signing In':'Sign In'}
                </Button>
                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up"/>
            </form>
        </>
    );
};
export default SignIn;
