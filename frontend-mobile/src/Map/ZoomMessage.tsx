import { StyleSheet, Text, View } from "react-native";

/**
 * A component that tells the user to zoom in to see vessels.
 */
export default function ZoomMessage() {
  return (
    <View style={styles.zoomMessageContainer}>
      <Text style={styles.zoomMessage}>Zoom in to see vessels</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  zoomMessage: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    fontSize: 16,
    color: "white",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  zoomMessageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    alignItems: "center",
    justifyContent: "center",
  },
});
