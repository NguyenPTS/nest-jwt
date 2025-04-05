import { applyDecorators, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Custom decorator để kết hợp @ApiTags và @Controller
 * @param path Đường dẫn của controller
 */
export function ApiController(path: string) {
  return applyDecorators(
    ApiTags(path), // Gắn tag cho Swagger UI
    Controller(path), // Định nghĩa route cho controller
  );
}
