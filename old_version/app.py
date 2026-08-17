from flask import Flask, render_template, request
import smtplib
from email.message import EmailMessage

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/enviar-solicitud", methods=["POST"])
def enviar_solicitud():
    nombre = request.form.get("nombre")
    direccion = request.form.get("direccion")
    comentarios = request.form.get("comentarios")

    msg = EmailMessage()
    msg["Subject"] = "Solicitud de nueva iglesia"
    msg["From"] = "holymaps3@gmail.com"  # Cambiá esto
    msg["To"] = "holymaps3@gmail.com"

    msg.set_content(f"""
    Nueva solicitud de iglesia:

    Nombre: {nombre}
    Dirección: {direccion}
    Comentarios: {comentarios}
    """)

    smtp = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    smtp.login("francenicolas.dw@gmail.com", "igdh ipyy usrg vfij")  # Usá clave de aplicación
    smtp.send_message(msg)
    smtp.quit()

    return "OK"

if __name__ == "__main__":
    app.run(debug=True)
