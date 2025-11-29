import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Перевірка обов'язкових полів
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, пароль та ім'я обов'язкові" },
        { status: 400 }
      )
    }

    // Перевірка чи email вже існує
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Користувач з таким email вже існує" },
        { status: 400 }
      )
    }

    // Генеруємо унікальний slug з імені
    let slug = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9а-яіїєґ]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    // Перевіряємо унікальність slug
    const existingSlug = await prisma.user.findUnique({
      where: { slug }
    })

    if (existingSlug) {
      // Додаємо випадкове число якщо slug зайнятий
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`
    }

    // Хешуємо пароль
    const passwordHash = await bcrypt.hash(password, 12)

    // Створюємо користувача
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        slug,
      },
      select: {
        id: true,
        email: true,
        name: true,
        slug: true,
        createdAt: true,
      }
    })

    return NextResponse.json(
      { message: "Реєстрація успішна", user },
      { status: 201 }
    )

  } catch (error) {
    console.error("Помилка реєстрації:", error)
    return NextResponse.json(
      { error: "Внутрішня помилка сервера" },
      { status: 500 }
    )
  }
}