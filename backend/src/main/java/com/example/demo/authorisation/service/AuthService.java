@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public AuthResponse register(RegisterRequest request) {
        // Проверяем email
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(false, "Пользователь с таким email уже существует", null);
        }
        
        // Проверяем телефон (если указан)
        if (request.getPhone() != null && !request.getPhone().isEmpty() && 
            userRepository.existsByPhone(request.getPhone())) {
            return new AuthResponse(false, "Пользователь с таким телефоном уже существует", null);
        }
        
        // Проверяем совпадение паролей
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return new AuthResponse(false, "Пароли не совпадают", null);
        }
        
        // Проверяем минимальную длину пароля
        if (request.getPassword().length() < 6) {
            return new AuthResponse(false, "Пароль должен содержать минимум 6 символов", null);
        }
        
        // Создаем нового пользователя с хешированным паролем
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        User savedUser = userRepository.save(user);
        
        // Создаем response без пароля
        UserResponse userResponse = new UserResponse(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getPhone(),
            savedUser.getRole()
        );
        
        return new AuthResponse(true, "Регистрация успешна", userResponse);
    }
    
    public AuthResponse login(LoginRequest request) {
        // Ищем пользователя по email
        User user = userRepository.findByEmail(request.getEmail())
            .orElse(null);
        
        if (user == null) {
            return new AuthResponse(false, "Пользователь не найден", null);
        }
        
        // Проверяем пароль (сравниваем хеши)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new AuthResponse(false, "Неверный пароль", null);
        }
        
        // Создаем response без пароля
        UserResponse userResponse = new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole()
        );
        
        return new AuthResponse(true, "Вход выполнен успешно", userResponse);
    }
}