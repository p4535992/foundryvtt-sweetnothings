# Sweet Nothings
## v1.5.0 - 2023-07-24
 - Fixed bug that should have been resolved in v1.4.3 with whispers not being sent when editor set to ProseMirror ( #16 )
 - Fixed bug that caused notifications to be played globally rather than locally ( #19 )
 - Fixed bug that caused no notifications unless "for rolls" was enabled ( #20 )
 
## v1.4.3 - 2023-07-13
 - Fixed bug that prevented whispers from being sent when editor was set to ProseMirror

## v1.4.2 - 2023-05-31
 - Fixed deprecation warnings
 - Fixed bug that could cause the whisper dialog box to not render.
 - Fixed bug where whispering only to a GM could cause the whisper to fail.
 - Fixed bug that would close the dialog if Send button was clicked but no whisper recipients.
 - Fixed bug that did not properly set the engine for the text editor based on configuration choice.
 - Added ability to send whispers as the selected token.
 
## v1.4.1 - 2023-05-24
 - FoundryVTT v11 Compatibility Update
 - Fixed bug where Reply To function was not properly working
 
## v1.4.0 - 2022-09-15
 - Enabled ability to change the Rich Text Editor, making it either Prose (Foundry VTT v10 Default), TinyMCE (Foundry VTT v9 Default), or None (basic text box)
 - Reworked whisper history, vastly improving dialog load and response times! ( #12 )
 - Added a small API for the module, available via game.whisperSweetNothings.  Currently only one method - game.whisperSweetNothings.whisperSweetNothings(isReply)
 
## v1.3.4 - 2022-07-21
 - FoundryVTT v10 Compatibility Update
 
## v1.3.3 - 2022-06-30
 - Created a framework for enabled/disabling audio and toast notifications for external modules
 - Added the "damage-log" as an external module to above framework.
 - Adjusted the border styling of the whisper history to make it more visible when over certain other UI's.

## v1.3.2 - 2022-06-08
 - Fixed a bug where chat modes were not respecting the selected token.
 
## v1.3.1 - 2022-06-08
 - Added new configuration options to enable toast, sound, and appearance in whisper history for messages with roll data (disabled by default)

## v1.3.0 - 2022-06-05
 - Corrected bug where config menu could not be accessed with the cog wheel from the Sweet Nothings dialog.
 - Corrected bug where, upon changing preferred defaults, they would not take until a refresh happened.
 - Corrected bug where, when using the reply function, it was not correctly picking the correct recipient
 - Changed reply logic to allow sending whispers to any user, whether they were online or not.
 - Added an option for GM's to force whispers to always be tagged as In Character, to play nice with the Tabbed Chatlog module.
 - Added a global, per client option to show a toast notification when they received a whisper.
 - Added a global, per client configurable option to play a sound when receiving a new whisper.
 - Added a new one-time message upon a user signing in, introducing them to (Whisper) Sweet Nothings.
 - Added a whisper history that filters based on the selected recipient(s).

## v1.2.2 - 2022-03-14
 - Added Japanese translation thanks to @besardida!
  
## v1.2.1 - 2022-02-21
 - Removed unnecessary console.log
 - Fixed keybind event handlers to prevent default browser behaviors from also firing
  
## v1.2.0 - 2022-01-12
 - Added Reply functionality
 
## v1.0.0 - 2021-12-27
- First release of Sweet Nothings