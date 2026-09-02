import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// KeyboardAvoidingView's height-compensation animation on Android can get
// stuck open after the keyboard closes via the send button (known combo bug
// with inverted FlatLists). Listening to the real show/hide events directly
// and setting padding on hide is deterministic -- no animation state to miss.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showSub = Keyboard.addListener(showEvent, e => setHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
