import WebSocket from "ws";
import xmlbuilder from "xmlbuilder";

export function SendFeatures(
  isAuthenticated: boolean,
  socket: WebSocket
): void {
  if (isAuthenticated) {
    socket.send(
      xmlbuilder
        .create("stream:features")
        .attribute("xmlns:stream", "http://etherx.jabber.org/streams")
        .element("ver")
        .attribute("xmlns", "urn:xmpp:features:rosterver")
        .up()
        .element("starttls")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-tls")
        .up()
        .element("bind")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind")
        .up()
        .element("compression")
        .attribute("xmlns", "http://jabber.org/features/compress")
        .element("method", "zlib")
        .up()
        .up()
        .element("session")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-session")
        .up()
        .toString()
    );
  } else {
    socket.send(
      xmlbuilder
        .create("stream:features")
        .attribute("xmlns:stream", "http://etherx.jabber.org/streams")
        .element("mechanisms")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
        .element("mechanism", "PLAIN")
        .up()
        .up()
        .element("ver")
        .attribute("xmlns", "urn:xmpp:features:rosterver")
        .up()
        .element("starttls")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-tls")
        .up()
        .element("compression")
        .attribute("xmlns", "http://jabber.org/features/compress")
        .element("method", "zlib")
        .up()
        .up()
        .element("auth")
        .attribute("xmlns", "http://jabber.org/features/iq-auth")
        .up()
        .toString()
    );
  }
}
