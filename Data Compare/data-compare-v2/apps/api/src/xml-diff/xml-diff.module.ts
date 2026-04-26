import { Module } from "@nestjs/common";
import { XmlDiffService } from "./xml-diff.service";
import { XmlDiffController } from "./xml-diff.controller";

@Module({
  providers: [XmlDiffService],
  controllers: [XmlDiffController],
})
export class XmlDiffModule {}
