<div>
    <p>Hello {{ $user->name }},</p>
    <p>Your Google account was successfully used to sign in to Toastkart.</p>
    <p>Sign-in method: Google<br>
    Account: {{ $user->email }}</p>
    <p>If this was you, no further action is required.</p>
    <p>If you did not sign in to Toastkart, please secure your Google account and contact Toastkart support.</p>
    <br>
    <p>Regards,<br>Toastkart Team</p>
</div>
